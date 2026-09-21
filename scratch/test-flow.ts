/**
 * Complete Flow Verification Script
 *
 * Simulates:
 * 1. Starting an assessment via startAssessment logic (DB creation)
 * 2. Fetching questions for /assessment/${attemptId} via fetchQuestions(attemptId, userId)
 * 3. Submitting answers via submitAssessment(attemptId, answers)
 * 4. Fetching result via getAssessmentResult(attemptId)
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scratch/test-flow.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchQuestions } from "../src/lib/assessment/api/fetchQuestions";
import { evaluateAssessment } from "../src/lib/assessment/evaluate";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("=== Testing Complete Assessment Flow ===");

    // 1. Get user & test
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) { console.error("No user in DB"); process.exit(1); }

    const test = await prisma.test.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (!test) { console.error("No test in DB"); process.exit(1); }

    // 2. Create an attempt (simulates /api/assessment/start)
    const attempt = await prisma.assessmentAttempt.create({
        data: {
            userId: user.id,
            testId: test.id,
            status: "ACTIVE",
            durationMinutes: 30,
            totalQuestions: 2,
            totalMarks: 2,
        },
    });

    const attemptId = attempt.id;
    console.log(`✅ Step 1: Created attempt: ${attemptId}`);
    console.log(`   Navigating URL: /assessment/${attemptId}`);

    // 3. Create 2 MCQ questions
    const q1 = await prisma.assessmentQuestion.create({
        data: {
            assessmentAttemptId: attemptId,
            questionType: "MCQ",
            difficulty: "EASY",
            topic: "CS Fundamentals",
            questionText: "What is 2 + 2?",
            timeLimit: 60,
            marks: 1,
            metadata: { options: ["3", "4", "5", "6"], correctAnswer: "4", explanation: "2+2=4" },
        },
    });

    const q2 = await prisma.assessmentQuestion.create({
        data: {
            assessmentAttemptId: attemptId,
            questionType: "MCQ",
            difficulty: "EASY",
            topic: "CS Fundamentals",
            questionText: "What is 3 * 3?",
            timeLimit: 60,
            marks: 1,
            metadata: { options: ["6", "7", "8", "9"], correctAnswer: "9", explanation: "3*3=9" },
        },
    });

    // 4. Test fetchQuestions for /assessment/${attemptId}
    const fetchedData = await fetchQuestions(attemptId, user.id);
    console.log(`✅ Step 2: /assessment/${attemptId} fetched ${fetchedData.questions.length} questions`);
    if (fetchedData.attemptId !== attemptId) throw new Error("attemptId mismatch");

    // 5. Seed answers and submit
    await prisma.assessmentAnswer.create({
        data: { assessmentAttemptId: attemptId, assessmentQuestionId: q1.id, userAnswer: "4", answeredAt: new Date() },
    });
    await prisma.assessmentAnswer.create({
        data: { assessmentAttemptId: attemptId, assessmentQuestionId: q2.id, userAnswer: "9", answeredAt: new Date() },
    });

    // Run evaluation (simulates submitAssessment)
    const evalRes = await evaluateAssessment(attemptId);
    console.log(`✅ Step 3: Submitted assessment & evaluated: score=${evalRes.obtainedMarks}/${evalRes.totalMarks}, result=${evalRes.result}`);
    console.log(`   Redirecting URL: /assessment/${attemptId}/result`);

    // 6. Verify result attempt status
    const finalAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId },
        select: { status: true, obtainedMarks: true, percentage: true, result: true },
    });

    console.log(`✅ Step 4: Result state verified: status=${finalAttempt?.status}, score=${finalAttempt?.obtainedMarks}, percentage=${finalAttempt?.percentage}%`);

    if (finalAttempt?.status !== "COMPLETED") throw new Error("Attempt status not COMPLETED");

    // Cleanup test attempt
    await prisma.assessmentAttempt.delete({ where: { id: attemptId } });
    console.log("✅ Cleanup test attempt complete.");
    console.log("\n🎉 ALL STEPS PASSED SUCCESSFULLY.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
