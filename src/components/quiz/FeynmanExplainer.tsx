"use client";

import { useState } from "react";
import { Brain, Send, ChevronDown, ChevronUp } from "lucide-react";

interface FeynmanExplainerProps {
  question: string;
  answer: string;
  onSubmit: (explanation: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function FeynmanExplainer({
  question,
  answer,
  onSubmit,
  onSkip,
  isLoading = false,
}: FeynmanExplainerProps) {
  const [explanation, setExplanation] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const MIN_LENGTH = 30;
  const canSubmit = explanation.trim().length >= MIN_LENGTH;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-indigo-50 border-b border-indigo-200">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-indigo-900">Feynman Technique</h2>
            <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Mastery Check
            </span>
          </div>
          <p className="text-sm text-indigo-700 mt-1">
            You&apos;ve answered this correctly 3 times. Now explain it in your own words — as if teaching someone who knows nothing about it.
          </p>
        </div>

        {/* Question */}
        <div className="px-6 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Question:</p>
          <p className="text-gray-900 font-medium">{question}</p>
        </div>

        {/* Explanation textarea */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your explanation (in plain language):
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={5}
            placeholder="Explain this concept as if you're teaching it to a curious 12-year-old..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              {explanation.length < MIN_LENGTH
                ? `${MIN_LENGTH - explanation.length} more characters needed`
                : "Ready to submit!"}
            </span>
            <span className="text-xs text-gray-400">{explanation.length} chars</span>
          </div>
        </div>

        {/* Reference answer toggle */}
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            {showAnswer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAnswer ? "Hide" : "Show"} reference answer
          </button>
          {showAnswer && (
            <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={() => onSubmit(explanation.trim())}
            disabled={!canSubmit || isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
