"use client";

import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { QuestionCard, RatingOption } from "@/components/quiz/QuestionCard";
import { FeynmanExplainer } from "@/components/quiz/FeynmanExplainer";
import { SessionSummary } from "@/components/quiz/SessionSummary";
import { QuestionReason } from "@prisma/client";
import { Loader2 } from "lucide-react";

interface SessionQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  index: number;
  reason: QuestionReason;
  wasReview: boolean;
}

type Phase = "loading" | "quiz" | "feynman" | "summary";

export default function LearnPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feynmanQuestion, setFeynmanQuestion] = useState<SessionQuestion | null>(null);
  const [summaryData, setSummaryData] = useState<{
    questionsAttempted: number;
    questionsCorrect: number;
    durationSeconds: number;
    dueCount: number;
  } | null>(null);

  const generateSession = trpc.sessions.generate.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setQuestions(data.questions as SessionQuestion[]);
      setCurrentIndex(0);
      setPhase("quiz");
    },
  });

  const submitAnswer = trpc.sessions.submitAnswer.useMutation({
    onSuccess: (data) => {
      if (data.shouldFeynman && questions[currentIndex]) {
        setFeynmanQuestion(questions[currentIndex]);
        setPhase("feynman");
      } else {
        advanceOrEnd();
      }
    },
  });

  const endSession = trpc.sessions.end.useMutation({
    onSuccess: (data) => {
      if (data) {
        setSummaryData({ ...data, dueCount: 0 });
        setPhase("summary");
      }
    },
  });

  const saveFeynman = trpc.sessions.saveFeynman.useMutation({
    onSuccess: () => {
      setFeynmanQuestion(null);
      advanceOrEnd();
    },
  });

  const dueCount = trpc.progress.dueCount.useQuery(undefined, { enabled: phase === "summary" });

  // Start session on mount — must be in useEffect, not in render body
  useEffect(() => {
    generateSession.mutate({ sessionType: "MIXED", targetCount: 20 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advanceOrEnd = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      endSession.mutate({ sessionId });
    } else {
      setCurrentIndex(nextIndex);
      setPhase("quiz");
    }
  }, [currentIndex, questions.length, sessionId, endSession]);

  const handleRate = (rating: RatingOption) => {
    const q = questions[currentIndex];
    if (!q) return;
    submitAnswer.mutate({
      sessionId,
      questionId: q.id,
      rating,
      wasReview: q.wasReview,
      questionIndex: q.index,
      reason: q.reason,
    });
  };

  const startSession = () => {
    setPhase("loading");
    generateSession.mutate({ sessionType: "MIXED", targetCount: 20 });
  };

  if (phase === "loading" || generateSession.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your session...</p>
        </div>
      </div>
    );
  }

  if (phase === "feynman" && feynmanQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <FeynmanExplainer
          question={feynmanQuestion.question}
          answer={feynmanQuestion.answer}
          onSubmit={(explanation) =>
            saveFeynman.mutate({ questionId: feynmanQuestion.id, explanation })
          }
          onSkip={() => {
            setFeynmanQuestion(null);
            advanceOrEnd();
          }}
          isLoading={saveFeynman.isPending}
        />
      </div>
    );
  }

  if (phase === "summary" && summaryData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <SessionSummary
          questionsAttempted={summaryData.questionsAttempted}
          questionsCorrect={summaryData.questionsCorrect}
          durationSeconds={summaryData.durationSeconds}
          dueCount={dueCount.data ?? 0}
          onRestart={startSession}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <QuestionCard
        key={currentQuestion.id}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        category={currentQuestion.category}
        question={currentQuestion.question}
        answer={currentQuestion.answer}
        wasReview={currentQuestion.wasReview}
        onRate={handleRate}
        isLoading={submitAnswer.isPending}
      />
    </div>
  );
}
