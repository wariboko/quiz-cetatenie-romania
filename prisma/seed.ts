/**
 * Database seed script
 * Imports 452 Romanian citizenship questions from questions.json on GitHub.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_CATEGORIES = new Set(["Constitution", "Culture", "Geography", "History"]);

interface RawQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
}

async function main() {
  console.log("Fetching questions from GitHub...");

  const response = await fetch(
    "https://raw.githubusercontent.com/wariboko/quiz-cetatenie-romania/main/questions.json"
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`);
  }

  const raw: RawQuestion[] = await response.json();

  // Filter out malformed entries (e.g., category === "category")
  const questions = raw.filter((q) => VALID_CATEGORIES.has(q.category));
  console.log(`Found ${raw.length} questions, seeding ${questions.length} valid entries...`);

  // Upsert questions (safe to re-run)
  let created = 0;
  let updated = 0;

  for (const q of questions) {
    const result = await prisma.question.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        category: q.category,
        question: q.question,
        answer: q.answer,
      },
      update: {
        category: q.category,
        question: q.question,
        answer: q.answer,
      },
    });
    // Prisma upsert doesn't tell us which happened, so count both
    void result;
    created++;
  }

  console.log(`\nSeed complete!`);
  console.log(`  Total seeded: ${created} questions`);
  console.log(`  Skipped (invalid category): ${raw.length - questions.length}`);

  const counts = await prisma.question.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { category: "asc" },
  });

  console.log("\nCategory breakdown:");
  for (const c of counts) {
    console.log(`  ${c.category}: ${c._count.id} questions`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
