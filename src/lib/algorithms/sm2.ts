/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 *
 * Quality scale (shown to user as Forgot / Hard / Good / Easy):
 *   0 = complete blackout (Forgot)
 *   1 = incorrect, remembered on seeing answer
 *   2 = incorrect but easy recall (Hard)
 *   3 = correct with serious difficulty
 *   4 = correct after hesitation (Good)
 *   5 = perfect recall (Easy)
 *
 * quality >= 3 is considered "correct" for streak tracking.
 */

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Input {
  quality: SM2Quality;
  easeFactor: number;   // current EF (default 2.5)
  interval: number;     // current interval in days (default 0)
  repetitions: number;  // consecutive correct answers (default 0)
}

export interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  correct: boolean;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, easeFactor, interval, repetitions } = input;

  // Update ease factor (clamp to minimum 1.3)
  const newEF = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const correct = quality >= 3;
  let newReps: number;
  let newInterval: number;

  if (!correct) {
    // Incorrect: reset repetitions, review again tomorrow
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // Reset time to midnight for day-level scheduling
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReviewDate,
    correct,
  };
}

/**
 * Map a 4-button user rating to SM-2 quality.
 * Buttons: "Forgot" | "Hard" | "Good" | "Easy"
 */
export function ratingToQuality(rating: "forgot" | "hard" | "good" | "easy"): SM2Quality {
  const map: Record<string, SM2Quality> = {
    forgot: 0,
    hard: 2,
    good: 4,
    easy: 5,
  };
  return map[rating];
}
