"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { MasteryRing } from "@/components/dashboard/MasteryRing";
import { CategoryBar } from "@/components/dashboard/CategoryBar";
import { BookOpen, Flame, RefreshCw, Target, Trophy, Calendar, Brain } from "lucide-react";
import { MasteryLevel } from "@prisma/client";

const MASTERY_LABELS: Record<MasteryLevel, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-gray-200 text-gray-600" },
  LEARNING: { label: "Learning", color: "bg-red-100 text-red-700" },
  FAMILIAR: { label: "Familiar", color: "bg-yellow-100 text-yellow-700" },
  PROFICIENT: { label: "Proficient", color: "bg-blue-100 text-blue-700" },
  MASTERED: { label: "Mastered", color: "bg-green-100 text-green-700" },
};

export default function DashboardPage() {
  const overview = trpc.progress.overview.useQuery();
  const categories = trpc.progress.categoryStats.useQuery();

  if (overview.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">Loading your progress...</div>
      </div>
    );
  }

  const stats = overview.data;
  const catStats = categories.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {stats ? `Week ${stats.currentWeek} of 13 — ${stats.milestone?.label ?? stats.phaseLabel}` : ""}
            </p>
          </div>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Start Session
          </Link>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.streak ?? 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">days</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Due Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.dueCount ?? 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">reviews</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mastered</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.masteredCount ?? 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">of {stats?.totalQuestions ?? 452}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Week</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.currentWeek ?? 1}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">of 13</p>
          </div>
        </div>

        {/* Main content: mastery ring + breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Overall mastery */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Overall Mastery</h2>
            <div className="flex items-center justify-around">
              <MasteryRing score={stats?.score ?? 0} />
              <div className="space-y-2">
                {stats &&
                  (
                    [
                      { level: MasteryLevel.MASTERED, count: stats.masteredCount },
                      { level: MasteryLevel.PROFICIENT, count: stats.proficientCount },
                      { level: MasteryLevel.FAMILIAR, count: stats.familiarCount },
                      { level: MasteryLevel.LEARNING, count: stats.learningCount },
                      { level: MasteryLevel.NEW, count: stats.newCount },
                    ] as { level: MasteryLevel; count: number }[]
                  ).map(({ level, count }) => {
                    const m = MASTERY_LABELS[level];
                    return (
                      <div key={level} className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.color}`}>
                          {m.label}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">By Category</h2>
            {catStats ? (
              <div className="space-y-4">
                {Object.entries(catStats).map(([cat, s]) => (
                  <CategoryBar
                    key={cat}
                    category={cat}
                    seen={s.seen}
                    total={s.total}
                    mastered={s.mastered}
                    score={s.score}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Loading categories...</p>
            )}
          </div>
        </div>

        {/* 90-day milestone progress */}
        {stats?.milestone && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">90-Day Milestones</h2>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {([3, 6, 9, 12, 13] as const).map((week) => {
                const isPast = (stats.currentWeek ?? 0) > week;
                const isCurrent = stats.currentWeek === week;
                return (
                  <div
                    key={week}
                    className={`rounded-xl border p-3 text-center text-xs ${
                      isCurrent
                        ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30"
                        : isPast
                        ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30"
                        : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30"
                    }`}
                  >
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Wk {week}</p>
                    <p className={`mt-1 ${isPast ? "text-green-600" : "text-gray-400"}`}>
                      {isPast ? "✓" : isCurrent ? "●" : "○"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/learn"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center gap-2 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Learn</span>
          </Link>
          <Link
            href="/review"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center gap-2 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-sm transition-all"
          >
            <RefreshCw className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review Due</span>
          </Link>
          <Link
            href="/blueprint"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center gap-2 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-sm transition-all"
          >
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Blueprint</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
