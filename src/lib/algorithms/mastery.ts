/**
 * Mastery Level Calculation
 *
 * Mastery is determined by accuracy rate AND spaced repetition interval.
 * A question is only MASTERED when it has been retained over a long period.
 */

import { MasteryLevel } from "@prisma/client";

export interface MasteryInput {
  totalAttempts: number;
  correctAttempts: number;
  interval: number;       // SM-2 interval in days
  repetitions: number;    // consecutive correct answers
}

export function calculateMastery(input: MasteryInput): MasteryLevel {
  const { totalAttempts, correctAttempts, interval, repetitions } = input;

  if (totalAttempts === 0) return MasteryLevel.NEW;

  const accuracy = correctAttempts / totalAttempts;

  // MASTERED: high accuracy + seen many times + long interval
  if (accuracy >= 0.9 && interval >= 21 && repetitions >= 5) {
    return MasteryLevel.MASTERED;
  }

  // PROFICIENT: good accuracy
  if (accuracy >= 0.75 && repetitions >= 3) {
    return MasteryLevel.PROFICIENT;
  }

  // FAMILIAR: moderate accuracy
  if (accuracy >= 0.5 && repetitions >= 2) {
    return MasteryLevel.FAMILIAR;
  }

  return MasteryLevel.LEARNING;
}

/**
 * Calculate overall mastery score as percentage of questions mastered.
 */
export function masteryScore(levels: MasteryLevel[]): number {
  if (levels.length === 0) return 0;
  const weights: Record<MasteryLevel, number> = {
    NEW: 0,
    LEARNING: 0.25,
    FAMILIAR: 0.5,
    PROFICIENT: 0.75,
    MASTERED: 1.0,
  };
  const total = levels.reduce((sum, l) => sum + weights[l], 0);
  return total / levels.length;
}

/** Total questions per category */
export const CATEGORY_TOTALS: Record<string, number> = {
  Culture: 120,
  Constitution: 117,
  Geography: 109,
  History: 106,
};

export const TOTAL_QUESTIONS = 452;
