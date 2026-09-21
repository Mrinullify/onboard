/**
 * Test script: Simulates the evaluation pipeline on an existing attempt.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scratch/test-evaluate.ts
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

async function main() {
    // Find an attempt that has MCQ questions
    let attempt = await prisma.assessmentAttempt.findFirst({
        where: {
            status: { in: ["ACTIVE", "SUBMITTED"] },
        },
        include: {
            questions: { orderBy: { createdAt: "asc" } },
        },
    });

    if (!attempt || attempt.questions.length === 0) {
        console.log("No ACTIVE/SUBMITTED attempt with questions found. Trying any attempt...");

        attempt = await prisma.assessmentAttempt.findFirst({
            where: {
                questions: { some: {} },
            },
            include: {
                questions: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!attempt) {
            console.error("No attempts with questions exist in the database.");
            process.exit(1);
        }

        // Reset this attempt to ACTIVE for testing
        await prisma.assessmentAttempt.update({
            where: { id: attempt.id },
            data: { status: "ACTIVE", obtainedMarks: null, percentage: null, result: null },
        });
        console.log(`Reset attempt ${attempt.id} to ACTIVE for testing`);
    }

    const questions = attempt.questions;
    console.log(`\nAttempt: ${attempt.id}`);
    console.log(`Questions: ${questions.length}`);
    console.log(`Types: ${questions.map((q) => q.questionType).join(", ")}`);

    // Seed answers — alternate correct/incorrect for MCQ
    let seededCorrect = 0;
    let seededIncorrect = 0;

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let userAnswer: string;

        if (q.questionType === "MCQ") {
            const meta = q.metadata as unknown as MCQMetadata;
            if (i % 2 === 0) {
                userAnswer = meta.correctAnswer;
                seededCorrect++;
            } else {
                userAnswer = meta.options.find((o) => o !== meta.correctAnswer) ?? meta.options[0];
                seededIncorrect++;
            }
        } else {
            userAnswer = "Test scenario answer for evaluation pipeline.";
        }

        await prisma.assessmentAnswer.upsert({
            where: { assessmentQuestionId: q.id },
            update: { userAnswer, answeredAt: new Date(), score: null },
            create: {
                assessmentAttemptId: attempt.id,
                assessmentQuestionId: q.id,
                userAnswer,
                answeredAt: new Date(),
            },
        });
    }

    console.log(`Seeded answers: ${seededCorrect} correct MCQ, ${seededIncorrect} incorrect MCQ`);

    // Import and run evaluation using the app's prisma instance via relative path
    // We can't use path aliases, so import the function's logic inline
    const { evaluateAssessment } = await import("../src/lib/assessment/evaluate");
    const result = await evaluateAssessment(attempt.id);

    console.log("\n=== Evaluation Result ===");
    console.log(JSON.stringify(result, null, 2));

    // Verify DB state
    const updatedAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt.id },
        select: {
            status: true,
            totalMarks: true,
            obtainedMarks: true,
            percentage: true,
            result: true,
        },
    });
    console.log("\n=== DB Attempt State ===");
    console.log(JSON.stringify(updatedAttempt, null, 2));

    const answers = await prisma.assessmentAnswer.findMany({
        where: { assessmentAttemptId: attempt.id },
        select: {
            score: true,
            userAnswer: true,
            assessmentQuestion: { select: { questionType: true, marks: true } },
        },
    });
    console.log("\n=== Answer Scores ===");
    for (const a of answers) {
        console.log(
            `  ${a.assessmentQuestion.questionType} (${a.assessmentQuestion.marks}pts): ` +
            `score=${a.score ?? "null"} | answer="${(a.userAnswer ?? "").slice(0, 50)}"`
        );
    }

    console.log("\n✅ Evaluation pipeline test complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
