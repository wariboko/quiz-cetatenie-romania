/**
 * 90-Day Weekly Learning Blueprint Generator
 *
 * Produces 13 weekly plans aligned with the four learning phases.
 */

import { LearningPhase } from "@prisma/client";

export interface WeekPlanConfig {
  weekNumber: number;
  phase: LearningPhase;
  startDate: Date;
  endDate: Date;
  targetMinutesPerDay: number;
  targetQuestionsPerDay: number;
  focusCategories: string[];
  description: string;
}

const PHASE_CONFIG: Record<
  LearningPhase,
  {
    minutesPerDay: number;
    questionsPerDay: number;
    description: string;
  }
> = {
  FOUNDATION: {
    minutesPerDay: 35,
    questionsPerDay: 20,
    description: "Building fundamentals with Constitution & History",
  },
  EXPANSION: {
    minutesPerDay: 50,
    questionsPerDay: 25,
    description: "Expanding across all 4 categories with interleaving",
  },
  DEEPENING: {
    minutesPerDay: 60,
    questionsPerDay: 30,
    description: "Review-heavy sessions with Feynman technique",
  },
  MASTERY: {
    minutesPerDay: 75,
    questionsPerDay: 35,
    description: "Exam prep with targeted weak-area remediation",
  },
};

const WEEK_PHASES: LearningPhase[] = [
  "FOUNDATION", "FOUNDATION", "FOUNDATION",       // weeks 1–3
  "EXPANSION",  "EXPANSION",  "EXPANSION",  "EXPANSION", // weeks 4–7
  "DEEPENING",  "DEEPENING",  "DEEPENING",          // weeks 8–10
  "MASTERY",    "MASTERY",    "MASTERY",             // weeks 11–13
];

const WEEK_CATEGORIES: Record<number, string[]> = {
  1:  ["Constitution", "History"],
  2:  ["Constitution", "History"],
  3:  ["Constitution", "History", "Geography"],
  4:  ["Constitution", "History", "Geography", "Culture"],
  5:  ["Constitution", "Culture"],
  6:  ["Geography", "History"],
  7:  ["Constitution", "Culture", "Geography", "History"],
  8:  ["Culture", "Geography"],
  9:  ["Culture", "Geography", "History"],
  10: ["Constitution", "Culture", "Geography", "History"],
  11: ["Constitution", "Culture", "Geography", "History"],
  12: ["Constitution", "Culture", "Geography", "History"],
  13: ["Constitution", "Culture", "Geography", "History"],
};

export function generate90DayPlan(startDate: Date): WeekPlanConfig[] {
  const plans: WeekPlanConfig[] = [];

  for (let week = 1; week <= 13; week++) {
    const phase = WEEK_PHASES[week - 1];
    const config = PHASE_CONFIG[phase];
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    plans.push({
      weekNumber: week,
      phase,
      startDate: weekStart,
      endDate: weekEnd,
      targetMinutesPerDay: config.minutesPerDay,
      targetQuestionsPerDay: config.questionsPerDay,
      focusCategories: WEEK_CATEGORIES[week] ?? ["Constitution", "Culture", "Geography", "History"],
      description: config.description,
    });
  }

  return plans;
}

/**
 * Get the current week number (1–13) based on user start date.
 * Returns 13 if past 90 days.
 */
export function getCurrentWeek(startDate: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - startDate.getTime();
  return Math.min(13, Math.max(1, Math.ceil(elapsed / msPerWeek)));
}

export const MILESTONES: Record<number, { label: string; targetMastery: number; targetExamScore: number | null }> = {
  3:  { label: "Foundation Complete", targetMastery: 0.25, targetExamScore: null },
  6:  { label: "Expansion Complete",  targetMastery: 0.50, targetExamScore: null },
  9:  { label: "Deepening Complete",  targetMastery: 0.75, targetExamScore: 0.80 },
  12: { label: "Mastery Checkpoint",  targetMastery: 0.90, targetExamScore: 0.90 },
  13: { label: "Top 1% Ready",        targetMastery: 0.95, targetExamScore: 0.95 },
};
