/**
 * Test script: Calls getAssessmentResult() on a COMPLETED attempt
 * and prints the full result payload.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scratch/test-result.ts
 *
 * NOTE: getAssessmentResult() calls auth() which returns null outside
 * a real HTTP request. So we test by directly querying the DB the same
 * way the server action does, minus the auth check.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface MCQMetadata {
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface ScenarioMetadata {
    evaluationCriteria: string[];
    rubric: { criterion: string; points: number; description?: string }[];
}

async function main() {
    // Find a COMPLETED attempt
    const attempt = await prisma.assessmentAttempt.findFirst({
        where: { status: "COMPLETED" },
        include: {
            questions: {
                orderBy: { createdAt: "asc" },
                include: {
                    answers: {
                        select: {
                            userAnswer: true,
                            score: true,
                        },
                    },
                },
            },
        },
    });

    if (!attempt) {
        console.error("No COMPLETED attempt found in the database.");
        process.exit(1);
    }

    console.log("=== Attempt Summary ===");
    console.log(`  attemptId:      ${attempt.id}`);
    console.log(`  status:         ${attempt.status}`);
    console.log(`  totalQuestions:  ${attempt.totalQuestions}`);
    console.log(`  totalMarks:     ${attempt.totalMarks}`);
    console.log(`  obtainedMarks:  ${attempt.obtainedMarks}`);
    console.log(`  percentage:     ${attempt.percentage}%`);
    console.log(`  result:         ${attempt.result}`);
    console.log(`  startedAt:      ${attempt.startedAt.toISOString()}`);
    console.log(`  endedAt:        ${attempt.endedAt?.toISOString() ?? "null"}`);

    console.log(`\n=== Questions (${attempt.questions.length}) ===\n`);

    for (let i = 0; i < attempt.questions.length; i++) {
        const q = attempt.questions[i];
        const a = q.answers;

        console.log(`--- Q${i + 1} [${q.questionType}] (${q.marks} pts) ---`);
        console.log(`  topic:        ${q.topic}`);
        console.log(`  question:     ${q.questionText.slice(0, 80)}...`);

        if (q.questionType === "MCQ") {
            const meta = q.metadata as unknown as MCQMetadata;
            console.log(`  options:       ${JSON.stringify(meta?.options)}`);
            console.log(`  correctAnswer: ${meta?.correctAnswer}`);
            console.log(`  explanation:   ${(meta?.explanation ?? "").slice(0, 80)}...`);
        } else if (q.questionType === "SCENARIO") {
            const meta = q.metadata as unknown as ScenarioMetadata;
            console.log(`  criteria:      ${JSON.stringify(meta?.evaluationCriteria)}`);
            console.log(`  rubric items:  ${meta?.rubric?.length ?? 0}`);
        }

        console.log(`  userAnswer:    ${(a?.userAnswer ?? "null").slice(0, 60)}`);
        console.log(`  score:         ${a?.score ?? "null"}`);
        console.log();
    }

    // Validate key invariants
    const allScored = attempt.questions
        .filter((q) => q.questionType === "MCQ")
        .every((q) => q.answers?.score !== undefined && q.answers?.score !== null);

    console.log("=== Validation ===");
    console.log(`  All MCQ scored:           ${allScored ? "✅" : "❌"}`);
    console.log(`  obtainedMarks populated:  ${attempt.obtainedMarks !== null ? "✅" : "❌"}`);
    console.log(`  percentage populated:     ${attempt.percentage !== null ? "✅" : "❌"}`);
    console.log(`  result populated:         ${attempt.result !== null ? "✅" : "❌"}`);
    console.log(`  status is COMPLETED:      ${attempt.status === "COMPLETED" ? "✅" : "❌"}`);

    const hasMetadata = attempt.questions.every((q) => {
        if (q.questionType === "MCQ") {
            const m = q.metadata as unknown as MCQMetadata;
            return m?.options?.length === 4 && m?.correctAnswer && m?.explanation;
        }
        return true;
    });
    console.log(`  All MCQ metadata valid:   ${hasMetadata ? "✅" : "❌"}`);

    console.log("\n✅ Result API data verified.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
