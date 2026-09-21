/**
 * Self-contained scenario evaluation test.
 * Seeds a fake ACTIVE attempt with 3 MCQ + 2 SCENARIO questions,
 * runs evaluateAssessment(), and verifies all fields.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scratch/test-scenario-eval.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MCQ_METADATA = (correct: string, others: string[]) => ({
    options: [correct, ...others],
    correctAnswer: correct,
    explanation: `${correct} is the correct answer.`,
});

const SCENARIO_METADATA = {
    evaluationCriteria: [
        "Identifies root cause clearly",
        "Proposes a practical solution",
        "Considers edge cases or trade-offs",
    ],
    rubric: [
        { criterion: "Root Cause Identification", points: 2, description: "Clear and accurate identification of the core problem" },
        { criterion: "Solution Quality", points: 2, description: "Practical and well-reasoned approach" },
        { criterion: "Trade-off Awareness", points: 1, description: "Recognises constraints or alternatives" },
    ],
};

const SCENARIO_ANSWERS = [
    "I would first check the application logs and recent deployment history to identify the root cause. Once identified, I would roll back to the last stable release to restore service. Then I would open a post-mortem to document the issue and add targeted monitoring alerts to detect similar failures earlier.",
    "To resolve the race condition I would introduce a distributed lock using Redis with a short TTL. This prevents multiple workers from processing the same job simultaneously. I would also add idempotency keys to ensure retried requests have no side effects.",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    // Find any user + test to attach the attempt to
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) { console.error("No users in DB"); process.exit(1); }

    const test = await prisma.test.findFirst({
        where: { userId: user.id },
        select: { id: true },
    });
    if (!test) { console.error("No tests in DB for this user"); process.exit(1); }

    // Create a fresh attempt
    const attempt = await prisma.assessmentAttempt.create({
        data: {
            userId: user.id,
            testId: test.id,
            status: "ACTIVE",
            durationMinutes: 30,
            totalQuestions: 5,
            totalMarks: 13, // 3*1 MCQ + 2*5 SCENARIO
        },
    });
    console.log(`\nCreated attempt: ${attempt.id}`);

    // Create 3 MCQ questions
    const mcqQuestions = await Promise.all([
        prisma.assessmentQuestion.create({
            data: {
                assessmentAttemptId: attempt.id,
                questionType: "MCQ",
                difficulty: "EASY",
                topic: "CS Fundamentals",
                questionText: "What does CPU stand for?",
                timeLimit: 60,
                marks: 1,
                metadata: MCQ_METADATA("Central Processing Unit", ["Central Program Unit", "Computer Processing Unit", "Core Processing Unit"]),
            },
        }),
        prisma.assessmentQuestion.create({
            data: {
                assessmentAttemptId: attempt.id,
                questionType: "MCQ",
                difficulty: "MEDIUM",
                topic: "Data Structures & Algorithms",
                questionText: "What is the time complexity of binary search?",
                timeLimit: 60,
                marks: 1,
                metadata: MCQ_METADATA("O(log n)", ["O(n)", "O(1)", "O(n log n)"]),
            },
        }),
        prisma.assessmentQuestion.create({
            data: {
                assessmentAttemptId: attempt.id,
                questionType: "MCQ",
                difficulty: "MEDIUM",
                topic: "Computer Networks",
                questionText: "Which protocol is used for secure web communication?",
                timeLimit: 60,
                marks: 1,
                metadata: MCQ_METADATA("HTTPS", ["HTTP", "FTP", "SMTP"]),
            },
        }),
    ]);

    // Create 2 SCENARIO questions
    const scenarioQuestions = await Promise.all([
        prisma.assessmentQuestion.create({
            data: {
                assessmentAttemptId: attempt.id,
                questionType: "SCENARIO",
                difficulty: "MEDIUM",
                topic: "System Design",
                questionText: "Your production service just went down affecting thousands of users. Describe how you would handle this incident in the next 30 minutes.",
                timeLimit: 240,
                marks: 5,
                metadata: SCENARIO_METADATA,
            },
        }),
        prisma.assessmentQuestion.create({
            data: {
                assessmentAttemptId: attempt.id,
                questionType: "SCENARIO",
                difficulty: "HARD",
                topic: "System Design",
                questionText: "You discover a race condition in a distributed payment processing system causing duplicate charges. How would you investigate and fix it without taking the system offline?",
                timeLimit: 240,
                marks: 5,
                metadata: SCENARIO_METADATA,
            },
        }),
    ]);

    console.log(`Created ${mcqQuestions.length} MCQ + ${scenarioQuestions.length} SCENARIO questions`);

    // Seed answers
    // MCQ: Q1 correct, Q2 correct, Q3 wrong
    const mcqAnswers = [
        { q: mcqQuestions[0], answer: "Central Processing Unit" },   // correct
        { q: mcqQuestions[1], answer: "O(log n)" },                  // correct
        { q: mcqQuestions[2], answer: "HTTP" },                      // wrong
    ];

    for (const { q, answer } of mcqAnswers) {
        await prisma.assessmentAnswer.create({
            data: {
                assessmentAttemptId: attempt.id,
                assessmentQuestionId: q.id,
                userAnswer: answer,
                answeredAt: new Date(),
            },
        });
    }

    for (let i = 0; i < scenarioQuestions.length; i++) {
        await prisma.assessmentAnswer.create({
            data: {
                assessmentAttemptId: attempt.id,
                assessmentQuestionId: scenarioQuestions[i].id,
                userAnswer: SCENARIO_ANSWERS[i],
                answeredAt: new Date(),
            },
        });
        console.log(`  Seeded SCENARIO answer ${i + 1}: "${SCENARIO_ANSWERS[i].slice(0, 70)}..."`);
    }

    // Expected MCQ score: 2/3 (Q3 wrong)
    // Expected totalMarks: 3 MCQ + 10 SCENARIO = 13

    // Run evaluation
    console.log("\n⏳ Running evaluateAssessment() (Groq calls for SCENARIO in progress)...\n");
    const { evaluateAssessment } = await import("../src/lib/assessment/evaluate");
    const evalResult = await evaluateAssessment(attempt.id);

    console.log("=== Evaluation Summary ===");
    console.log(JSON.stringify(evalResult, null, 2));

    // Verify DB state
    const updatedAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt.id },
        select: { status: true, totalMarks: true, obtainedMarks: true, percentage: true, result: true },
    });
    console.log("\n=== DB Attempt State ===");
    console.log(JSON.stringify(updatedAttempt, null, 2));

    // Per-answer details
    const allAnswers = await prisma.assessmentAnswer.findMany({
        where: { assessmentAttemptId: attempt.id },
        include: { assessmentQuestion: { select: { questionType: true, marks: true } } },
        orderBy: { assessmentQuestion: { createdAt: "asc" } },
    });

    console.log("\n=== Per-Answer Results ===");
    let mcqOk = true, scenarioScoreOk = true, scenarioFeedbackOk = true, scenarioAiEvalOk = true;

    for (const a of allAnswers) {
        const type = a.assessmentQuestion.questionType;
        const maxPts = a.assessmentQuestion.marks;
        console.log(`  [${type}] score=${a.score ?? "null"}/${maxPts}${a.feedback ? ` | feedback="${a.feedback.slice(0, 70)}..."` : ""}`);
        if (a.aiEvaluation) {
            console.log(`         aiEvaluation keys: ${Object.keys(a.aiEvaluation as object).join(", ")}`);
        }

        if (type === "MCQ" && a.score === null) mcqOk = false;
        if (type === "SCENARIO" && a.score === null) scenarioScoreOk = false;
        if (type === "SCENARIO" && !a.feedback) scenarioFeedbackOk = false;
        if (type === "SCENARIO" && !a.aiEvaluation) scenarioAiEvalOk = false;
    }

    // Validation
    console.log("\n=== Validation ===");
    const v = (ok: boolean, label: string) => console.log(`  ${ok ? "✅" : "❌"} ${label}`);
    v(updatedAttempt?.status === "COMPLETED", "status is COMPLETED");
    v(updatedAttempt?.obtainedMarks !== null, "obtainedMarks populated");
    v(updatedAttempt?.percentage !== null, "percentage populated");
    v(updatedAttempt?.result !== null, "result populated");
    v(mcqOk, "MCQ score ✓");
    v(scenarioScoreOk, "Scenario score ✓");
    v(scenarioFeedbackOk, "Scenario feedback ✓");
    v(scenarioAiEvalOk, "aiEvaluation ✓");

    const noScoreExceedsMax = allAnswers.every(
        (a) => a.score === null || a.score <= a.assessmentQuestion.marks
    );
    v(noScoreExceedsMax, "No score exceeds question marks ✓");

    console.log("\n✅ Scenario AI evaluation test complete.");

    // Cleanup
    await prisma.assessmentAttempt.delete({ where: { id: attempt.id } });
    console.log("Cleaned up test attempt.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
