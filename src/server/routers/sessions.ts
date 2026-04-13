/**
 * Sessions Router
 * - generateSession: create a new adaptive learning session
 * - submitAnswer: record a question answer and update SM-2 state
 * - endSession: finalize session stats
 */

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { calculateSM2, ratingToQuality } from "@/lib/algorithms/sm2";
import { composeSession, SessionSlot } from "@/lib/algorithms/interleaving";
import { calculateMastery } from "@/lib/algorithms/mastery";
import { MasteryLevel, QuestionReason, SessionType } from "@prisma/client";

export const sessionsRouter = router({
  /** Generate a new adaptive session of 20 questions */
  generate: protectedProcedure
    .input(
      z.object({
        sessionType: z.nativeEnum(SessionType).default("MIXED"),
        targetCount: z.number().min(5).max(50).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { targetCount, sessionType } = input;

      // 1. Get due reviews (SM-2 scheduled for today or earlier)
      const dueReviews = await ctx.prisma.questionProgress.findMany({
        where: {
          userId,
          nextReviewDate: { lte: new Date() },
          masteryLevel: { not: MasteryLevel.NEW },
        },
        orderBy: { nextReviewDate: "asc" },
        take: Math.ceil(targetCount * 0.5),
        include: { question: { select: { id: true, category: true } } },
      });

      // 2. Get weak areas (lowest accuracy, not due for review)
      const weakAreas = await ctx.prisma.questionProgress.findMany({
        where: {
          userId,
          totalAttempts: { gt: 0 },
          masteryLevel: { in: [MasteryLevel.LEARNING, MasteryLevel.FAMILIAR] },
          nextReviewDate: { gt: new Date() },
        },
        orderBy: [
          { consecutiveCorrect: "asc" },
          { totalAttempts: "desc" },
        ],
        take: Math.ceil(targetCount * 0.3),
        include: { question: { select: { id: true, category: true } } },
      });

      // 3. Get new questions not yet seen
      const seenIds = await ctx.prisma.questionProgress.findMany({
        where: { userId },
        select: { questionId: true },
      });
      const seenSet = new Set(seenIds.map((p) => p.questionId));

      const newQuestions = await ctx.prisma.question.findMany({
        where: { id: { notIn: [...seenSet] } },
        orderBy: { id: "asc" },
        take: targetCount,
        select: { id: true, category: true },
      });

      // Build session slots
      const dueSlots: SessionSlot[] = dueReviews.map((p) => ({
        questionId: p.question.id,
        category: p.question.category,
        reason: QuestionReason.REVIEW,
      }));
      const weakSlots: SessionSlot[] = weakAreas.map((p) => ({
        questionId: p.question.id,
        category: p.question.category,
        reason: QuestionReason.WEAK_AREA,
      }));
      const newSlots: SessionSlot[] = newQuestions.map((q) => ({
        questionId: q.id,
        category: q.category,
        reason: QuestionReason.NEW,
      }));

      // Use interleave bucket = from different categories in due reviews
      const categories = [...new Set(dueSlots.map((s) => s.category))];
      const interleaveSlots: SessionSlot[] = dueSlots
        .filter((s) => !categories.slice(0, 2).includes(s.category))
        .map((s) => ({ ...s, reason: QuestionReason.INTERLEAVE }));

      const composedSlots = composeSession(
        sessionType === "REVIEW_ONLY" ? dueSlots : dueSlots,
        sessionType === "REVIEW_ONLY" ? [] : newSlots,
        sessionType === "REVIEW_ONLY" ? [] : weakSlots,
        interleaveSlots,
        targetCount
      );

      // Create session record
      const session = await ctx.prisma.learningSession.create({
        data: { userId, sessionType },
      });

      // Fetch full question data for the session
      const questionIds = composedSlots.map((s) => s.questionId);
      const questions = await ctx.prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, category: true, question: true, answer: true },
      });

      // Map back to ordered list
      const questionsOrdered = composedSlots.map((slot, index) => {
        const q = questions.find((q) => q.id === slot.questionId)!;
        return {
          ...q,
          index,
          reason: slot.reason,
          wasReview: slot.reason === QuestionReason.REVIEW,
        };
      });

      return { sessionId: session.id, questions: questionsOrdered };
    }),

  /** Submit answer for a question in a session */
  submitAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        questionId: z.number(),
        rating: z.enum(["forgot", "hard", "good", "easy"]),
        responseSeconds: z.number().optional(),
        wasReview: z.boolean(),
        questionIndex: z.number(),
        reason: z.nativeEnum(QuestionReason),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const quality = ratingToQuality(input.rating);

      // Get or create progress record
      const existing = await ctx.prisma.questionProgress.findUnique({
        where: { userId_questionId: { userId, questionId: input.questionId } },
      });

      const prev = existing ?? {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        consecutiveCorrect: 0,
      };

      const sm2 = calculateSM2({
        quality,
        easeFactor: prev.easeFactor,
        interval: prev.interval,
        repetitions: prev.repetitions,
      });

      const totalAttempts = prev.totalAttempts + 1;
      const correctAttempts = prev.correctAttempts + (sm2.correct ? 1 : 0);
      const consecutiveCorrect = sm2.correct ? prev.consecutiveCorrect + 1 : 0;

      const masteryLevel = calculateMastery({
        totalAttempts,
        correctAttempts,
        interval: sm2.interval,
        repetitions: sm2.repetitions,
      });

      // Upsert progress
      const progress = await ctx.prisma.questionProgress.upsert({
        where: { userId_questionId: { userId, questionId: input.questionId } },
        create: {
          userId,
          questionId: input.questionId,
          easeFactor: sm2.easeFactor,
          interval: sm2.interval,
          repetitions: sm2.repetitions,
          nextReviewDate: sm2.nextReviewDate,
          lastQuality: quality,
          totalAttempts,
          correctAttempts,
          consecutiveCorrect,
          masteryLevel,
          lastReviewedAt: new Date(),
        },
        update: {
          easeFactor: sm2.easeFactor,
          interval: sm2.interval,
          repetitions: sm2.repetitions,
          nextReviewDate: sm2.nextReviewDate,
          lastQuality: quality,
          totalAttempts,
          correctAttempts,
          consecutiveCorrect,
          masteryLevel,
          lastReviewedAt: new Date(),
        },
      });

      // Record session question
      await ctx.prisma.sessionQuestion.create({
        data: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          userRating: quality,
          correct: sm2.correct,
          responseSeconds: input.responseSeconds,
          questionIndex: input.questionIndex,
          wasReview: input.wasReview,
          reason: input.reason,
        },
      });

      // Update global question stats
      await ctx.prisma.question.update({
        where: { id: input.questionId },
        data: {
          totalAttempts: { increment: 1 },
          correctAttempts: { increment: sm2.correct ? 1 : 0 },
        },
      });

      // Trigger Feynman if 3 consecutive correct and not yet done
      const shouldFeynman =
        consecutiveCorrect >= 3 &&
        sm2.correct &&
        (progress.feynmanCompleted ?? 0) === Math.floor((consecutiveCorrect - 1) / 3);

      return {
        correct: sm2.correct,
        nextReviewDate: sm2.nextReviewDate,
        masteryLevel,
        shouldFeynman,
        newInterval: sm2.interval,
      };
    }),

  /** End a session and calculate final stats */
  end: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.learningSession.findUnique({
        where: { id: input.sessionId },
        include: { questions: true },
      });
      if (!session) return null;

      const durationSeconds = Math.round(
        (Date.now() - session.startedAt.getTime()) / 1000
      );
      const correct = session.questions.filter((q) => q.correct).length;
      const accuracy = session.questions.length > 0 ? correct / session.questions.length : 0;

      await ctx.prisma.learningSession.update({
        where: { id: input.sessionId },
        data: {
          endedAt: new Date(),
          durationSeconds,
          questionsAttempted: session.questions.length,
          questionsCorrect: correct,
        },
      });

      return {
        questionsAttempted: session.questions.length,
        questionsCorrect: correct,
        accuracy,
        durationSeconds,
      };
    }),

  /** Save a Feynman explanation */
  saveFeynman: protectedProcedure
    .input(
      z.object({
        questionId: z.number(),
        explanation: z.string().min(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.prisma.feynmanResponse.create({
        data: { userId, questionId: input.questionId, explanation: input.explanation },
      });

      // Boost ease factor for completing Feynman
      await ctx.prisma.questionProgress.updateMany({
        where: { userId, questionId: input.questionId },
        data: {
          feynmanCompleted: { increment: 1 },
          easeFactor: { increment: 0.1 },
        },
      });

      return { saved: true };
    }),
});
