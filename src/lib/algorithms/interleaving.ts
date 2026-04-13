/**
 * Interleaving & Session Composition
 *
 * Each session of 20 questions is composed as:
 *  - 40% due reviews   (SM-2 scheduled)
 *  - 30% new questions (following weekly phase plan)
 *  - 20% weak areas    (lowest accuracy / recently failed)
 *  - 10% interleave    (cross-category diversity)
 *
 * No more than 3 consecutive questions from the same category.
 */

import { QuestionReason } from "@prisma/client";

export const VALID_CATEGORIES = ["Constitution", "Culture", "Geography", "History"] as const;
export type Category = (typeof VALID_CATEGORIES)[number];

export interface SessionSlot {
  questionId: number;
  category: string;
  reason: QuestionReason;
}

/** Shuffle array in place (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Re-order questions so no more than MAX_CLUSTER consecutive questions
 * share the same category.
 */
export function distributeByCategory(slots: SessionSlot[], maxCluster = 3): SessionSlot[] {
  const result: SessionSlot[] = [];
  const remaining = [...slots];

  while (remaining.length > 0) {
    const recentCats = result.slice(-maxCluster).map((s) => s.category);
    const clusterFull =
      recentCats.length === maxCluster &&
      recentCats.every((c) => c === recentCats[0]);

    if (clusterFull) {
      const lastCat = recentCats[0];
      const idx = remaining.findIndex((s) => s.category !== lastCat);
      if (idx !== -1) {
        result.push(remaining.splice(idx, 1)[0]);
        continue;
      }
    }

    result.push(remaining.shift()!);
  }

  return result;
}

/**
 * Compose a session of `targetCount` question slots.
 *
 * Inputs are pre-fetched question ID lists; this function only handles ordering.
 */
export function composeSession(
  dueReviews: SessionSlot[],
  newQuestions: SessionSlot[],
  weakAreas: SessionSlot[],
  interleave: SessionSlot[],
  targetCount = 20
): SessionSlot[] {
  const duePart = dueReviews.slice(0, Math.floor(targetCount * 0.4));
  const newPart = newQuestions.slice(0, Math.floor(targetCount * 0.3));
  const weakPart = weakAreas.slice(0, Math.floor(targetCount * 0.2));
  const interleavePart = interleave.slice(
    0,
    targetCount - duePart.length - newPart.length - weakPart.length
  );

  const combined = shuffle([
    ...duePart,
    ...newPart,
    ...weakPart,
    ...interleavePart,
  ]);

  return distributeByCategory(combined);
}
