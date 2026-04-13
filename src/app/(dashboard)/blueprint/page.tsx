"use client";

import { trpc } from "@/lib/trpc";
import { CheckCircle, Circle, ChevronRight } from "lucide-react";

const PHASE_COLORS: Record<string, string> = {
  FOUNDATION: "bg-blue-50 border-blue-200 text-blue-800",
  EXPANSION:  "bg-yellow-50 border-yellow-200 text-yellow-800",
  DEEPENING:  "bg-orange-50 border-orange-200 text-orange-800",
  MASTERY:    "bg-green-50 border-green-200 text-green-800",
};

export default function BlueprintPage() {
  const plan = trpc.progress.weeklyPlan.useQuery();

  if (plan.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading your 90-day blueprint...</p>
      </div>
    );
  }

  const data = plan.data;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">90-Day Learning Blueprint</h1>
          <p className="text-sm text-gray-500 mt-1">
            You are on Week {data.currentWeek} of 13. Follow the schedule daily to reach top 1% proficiency.
          </p>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PHASE_COLORS).map(([phase, color]) => (
            <span key={phase} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
              {phase.charAt(0) + phase.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        {/* Week cards */}
        <div className="space-y-3">
          {data.plans.map((week) => {
            const isPast = week.weekNumber < data.currentWeek;
            const isCurrent = week.weekNumber === data.currentWeek;
            const phaseColor = PHASE_COLORS[week.phase] ?? "bg-gray-50 border-gray-200";

            return (
              <div
                key={week.weekNumber}
                className={`bg-white rounded-xl border p-4 ${
                  isCurrent ? "border-blue-400 shadow-sm ring-1 ring-blue-200" : "border-gray-200"
                } ${isPast ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <Circle
                        className={`w-5 h-5 shrink-0 ${isCurrent ? "text-blue-500" : "text-gray-300"}`}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">Week {week.weekNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${phaseColor}`}>
                          {week.phase.charAt(0) + week.phase.slice(1).toLowerCase()}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(week.startDate).toLocaleDateString()} –{" "}
                        {new Date(week.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>

                {/* Goals */}
                <div className="mt-3 ml-8 grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-gray-900">{week.targetMinutesPerDay}m</p>
                    <p className="text-xs text-gray-500">per day</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-gray-900">{week.targetQuestionsPerDay}q</p>
                    <p className="text-xs text-gray-500">questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {week.focusCategories.length === 4 ? "All" : week.focusCategories.join(", ").split(",")[0]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {week.focusCategories.length === 4 ? "categories" : `+${week.focusCategories.length - 1} more`}
                    </p>
                  </div>
                </div>

                {/* Progress (for current/past weeks) */}
                {(isCurrent || isPast) && week.questionsCompleted > 0 && (
                  <div className="mt-3 ml-8">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Weekly progress</span>
                      <span>
                        {week.questionsCompleted} / {week.targetQuestionsPerDay * 7} questions
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (week.questionsCompleted / (week.targetQuestionsPerDay * 7)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
