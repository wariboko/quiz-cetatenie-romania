"use client";

import { CheckCircle, TrendingUp, Clock, Flame, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface SessionSummaryProps {
  questionsAttempted: number;
  questionsCorrect: number;
  durationSeconds: number;
  dueCount: number;
  onRestart: () => void;
}

export function SessionSummary({
  questionsAttempted,
  questionsCorrect,
  durationSeconds,
  dueCount,
  onRestart,
}: SessionSummaryProps) {
  const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  const getAccuracyColor = () => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMessage = () => {
    if (accuracy >= 90) return "Excellent! You&apos;re crushing it.";
    if (accuracy >= 75) return "Great work! Keep pushing.";
    if (accuracy >= 60) return "Good progress. Review weak areas.";
    return "Needs work. The repetition will help—keep going!";
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Session Complete!</h2>
          <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: getMessage() }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <div className="px-4 py-5 text-center">
            <p className={`text-3xl font-bold ${getAccuracyColor()}`}>{accuracy}%</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Accuracy
            </p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{questionsAttempted}</p>
            <p className="text-xs text-gray-500 mt-1">Questions</p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {mins}:{secs.toString().padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Time
            </p>
          </div>
        </div>

        {/* Due count */}
        {dueCount > 0 && (
          <div className="mx-6 my-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-800">
              <span className="font-semibold">{dueCount} questions</span> due for review right now.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={onRestart}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
