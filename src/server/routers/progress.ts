/**
 * Progress Router
 * - overview: overall mastery stats for the dashboard
 * - categoryStats: per-category breakdown
 * - weeklyPlan: current week plan and progress
 * - dueCount: number of questions due for review today
 */

import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { masteryScore, TOTAL_QUESTIONS, CATEGORY_TOTALS } from "@/lib/algorithms/mastery";
import { generate90DayPlan, getCurrentWeek, MILESTONES } from "@/lib/algorithms/weekly-plan";
import { MasteryLevel } from "@prisma/client";

export const progressRouter = router({
  /** Dashboard overview stats */
  overview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const allProgress = await ctx.prisma.questionProgress.findMany({
      where: { userId },
      select: { masteryLevel: true },
    });

    const levels = allProgress.map((p) => p.masteryLevel);
    const score = masteryScore(levels);

    // Mastery counts
    const masteredCount = levels.filter((l) => l === MasteryLevel.MASTERED).length;
    const proficientCount = levels.filter((l) => l === MasteryLevel.PROFICIENT).length;
    const familiarCount = levels.filter((l) => l === MasteryLevel.FAMILIAR).length;
    const learningCount = levels.filter((l) => l === MasteryLevel.LEARNING).length;
    const newCount = TOTAL_QUESTIONS - allProgress.length;

    // Streak (consecutive days with at least one session)
    const sessions = await ctx.prisma.learningSession.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
      take: 60,
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);

    for (let i = 0; i < 60; i++) {
      const hasSession = sessions.some((s) => {
        const d = new Date(s.startedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      });
      if (hasSession) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Allow current day not yet having a session
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Due today
    const dueCount = await ctx.prisma.questionProgress.count({
      where: { userId, nextReviewDate: { lte: new Date() }, masteryLevel: { not: MasteryLevel.NEW } },
    });

    // Current week
    const currentWeek = getCurrentWeek(user.startDate);
    const milestone = MILESTONES[currentWeek];

    return {
      score,
      totalQuestions: TOTAL_QUESTIONS,
      masteredCount,
      proficientCount,
      familiarCount,
      learningCount,
      newCount,
      streak,
      dueCount,
      currentWeek,
      milestone,
    };
  }),

  /** Per-category mastery breakdown */
  categoryStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const progress = await ctx.prisma.questionProgress.findMany({
      where: { userId },
      include: { question: { select: { category: true } } },
    });

    const stats: Record<
      string,
      { total: number; seen: number; mastered: number; score: number }
    > = {};

    for (const [cat, total] of Object.entries(CATEGORY_TOTALS)) {
      stats[cat] = { total, seen: 0, mastered: 0, score: 0 };
    }

    for (const p of progress) {
      const cat = p.question.category;
      if (!stats[cat]) continue;
      stats[cat].seen++;
      if (p.masteryLevel === MasteryLevel.MASTERED) stats[cat].mastered++;
    }

    // Compute weighted score per category
    for (const cat of Object.keys(stats)) {
      const catProgress = progress.filter((p) => p.question.category === cat);
      const levels = catProgress.map((p) => p.masteryLevel);
      stats[cat].score = masteryScore(levels);
    }

    return stats;
  }),

  /** Current week plan with progress */
  weeklyPlan: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const currentWeek = getCurrentWeek(user.startDate);
    const allWeeks = generate90DayPlan(user.startDate);

    // Ensure WeeklyPlan records exist for all 13 weeks
    const existing = await ctx.prisma.weeklyPlan.findMany({ where: { userId } });
    const existingWeeks = new Set(existing.map((w) => w.weekNumber));

    const toCreate = allWeeks.filter((w) => !existingWeeks.has(w.weekNumber));
    if (toCreate.length > 0) {
      await ctx.prisma.weeklyPlan.createMany({
        data: toCreate.map((w) => ({
          userId,
          weekNumber: w.weekNumber,
          startDate: w.startDate,
          endDate: w.endDate,
          targetMinutesPerDay: w.targetMinutesPerDay,
          targetQuestionsPerDay: w.targetQuestionsPerDay,
          focusCategories: w.focusCategories,
          phase: w.phase,
        })),
      });
    }

    const plans = await ctx.prisma.weeklyPlan.findMany({
      where: { userId },
      orderBy: { weekNumber: "asc" },
    });

    return { currentWeek, plans, milestones: MILESTONES };
  }),

  /** Count of questions due for review right now */
  dueCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.prisma.questionProgress.count({
      where: { userId, nextReviewDate: { lte: new Date() }, masteryLevel: { not: MasteryLevel.NEW } },
    });
  }),
});
