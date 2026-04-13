"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";

export type RatingOption = "forgot" | "hard" | "good" | "easy";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  category: string;
  question: string;
  answer: string;
  wasReview: boolean;
  onRate: (rating: RatingOption) => void;
  isLoading?: boolean;
}

const RATING_BUTTONS: { value: RatingOption; label: string; sublabel: string; color: string }[] = [
  { value: "forgot", label: "Forgot", sublabel: "Complete blank", color: "bg-red-100 border-red-300 text-red-700 hover:bg-red-200" },
  { value: "hard", label: "Hard", sublabel: "Got it wrong", color: "bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200" },
  { value: "good", label: "Good", sublabel: "Correct w/ effort", color: "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200" },
  { value: "easy", label: "Easy", sublabel: "Perfect recall", color: "bg-green-100 border-green-300 text-green-700 hover:bg-green-200" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Constitution: "bg-purple-100 text-purple-800",
  Culture: "bg-yellow-100 text-yellow-800",
  Geography: "bg-teal-100 text-teal-800",
  History: "bg-orange-100 text-orange-800",
};

export function QuestionCard({
  questionNumber,
  totalQuestions,
  category,
  question,
  answer,
  wasReview,
  onRate,
  isLoading = false,
}: QuestionCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [startTime] = useState(Date.now());

  const handleReveal = () => setRevealed(true);

  const handleRate = (rating: RatingOption) => {
    if (isLoading) return;
    onRate(rating);
    setRevealed(false);
  };

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const catColor = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {elapsed}s
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${catColor}`}>
            {category}
          </span>
          {wasReview && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
              Review
            </span>
          )}
        </div>

        {/* Question */}
        <div className="px-6 py-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">{question}</p>
        </div>

        {/* Answer reveal */}
        {!revealed ? (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 p-5 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Think about the answer, then reveal it</p>
              <button
                onClick={handleReveal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Show Answer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Answer */}
            <div className="px-6 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Answer</p>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{answer}</p>
              </div>
            </div>

            {/* Rating buttons */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 font-medium">
                How well did you know this?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {RATING_BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleRate(btn.value)}
                    disabled={isLoading}
                    className={`flex flex-col items-center px-2 py-3 rounded-xl border-2 transition-all ${btn.color} disabled:opacity-50`}
                  >
                    <span className="text-sm font-semibold">{btn.label}</span>
                    <span className="text-xs opacity-75 mt-0.5 text-center leading-tight">{btn.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
