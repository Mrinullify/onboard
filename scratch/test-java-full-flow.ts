/**
 * End-to-End Java Coding Question Flow Verification
 *
 * Tests:
 * 1. fetchQuestions security (hiddenTestCases stripped server-side)
 * 2. runCodingQuestion (executes visible test cases ONLY, no DB update)
 * 3. submitCodingQuestion (executes visible + hidden test cases via Docker, updates DB score, returns safe aggregate result)
 * 4. evaluateAssessment (computes total score including Docker-scored coding question)
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scratch/test-java-full-flow.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchQuestions } from "../src/lib/assessment/api/fetchQuestions";
import { runCodingQuestion } from "../src/lib/assessment/api/runCodingQuestion";
import { submitCodingQuestion } from "../src/lib/assessment/api/submitCodingQuestion";
import { evaluateAssessment } from "../src/lib/assessment/evaluate";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("=== End-to-End Java Coding Question Flow Test ===\n");

    // Get user & test
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) { console.error("No user in DB"); process.exit(1); }

    const test = await prisma.test.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (!test) { console.error("No test in DB"); process.exit(1); }

    // Create attempt
    const attempt = await prisma.assessmentAttempt.create({
        data: {
            userId: user.id,
            testId: test.id,
            status: "ACTIVE",
            durationMinutes: 30,
            totalQuestions: 1,
            totalMarks: 10,
        },
    });
    const attemptId = attempt.id;
    console.log(`Step 1: Created attempt ${attemptId}`);

    // Create Java CODING question
    const question = await prisma.assessmentQuestion.create({
        data: {
            assessmentAttemptId: attemptId,
            questionType: "CODING",
            difficulty: "MEDIUM",
            topic: "Java",
            questionText: "Write a program to read two integers and output their sum.",
            timeLimit: 1800,
            marks: 10,
            metadata: {
                language: "java",
                starterCode: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
                constraints: ["-10^9 <= a, b <= 10^9"],
                visibleTestCases: [
                    { input: "2 3", expectedOutput: "5" },
                    { input: "10 20", expectedOutput: "30" }
                ],
                hiddenTestCases: [
                    { input: "-5 5", expectedOutput: "0" },
                    { input: "100 -50", expectedOutput: "50" }
                ]
            },
        },
    });
    console.log(`Step 2: Created Java CODING question ${question.id}`);

    // Test 1: fetchQuestions security check
    console.log("\n--- Test 1: fetchQuestions Security ---");
    const fetched = await fetchQuestions(attemptId, user.id);
    const fetchedQ = fetched.questions[0];
    const meta = fetchedQ.metadata as any;
    console.log("Visible test cases in payload:", meta.visibleTestCases ? meta.visibleTestCases.length : 0);
    console.log("Hidden test cases in payload:", meta.hiddenTestCases !== undefined ? "EXPOSED (SECURITY VULNERABILITY)" : "SAFE (STRIPPED)");
    if (meta.hiddenTestCases !== undefined) {
        throw new Error("SECURITY FAILURE: hiddenTestCases exposed in fetchQuestions payload!");
    }
    console.log("✅ fetchQuestions security check PASSED.");

    // Test 2: Run Code (Visible test cases only)
    console.log("\n--- Test 2: Run Code (Visible Tests Only) ---");
    const validJavaCode = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;

    const runRes = await runCodingQuestion({
        attemptId,
        questionId: question.id,
        code: validJavaCode,
    });
    console.log("Run Code response:", JSON.stringify(runRes, null, 2));

    if (!runRes.success || runRes.result?.status !== "accepted") {
        throw new Error(`Run Code failed: ${runRes.error}`);
    }
    if (runRes.result.total !== 2) {
        throw new Error(`Expected 2 visible test cases, got ${runRes.result.total}`);
    }
    console.log("✅ Run Code (Visible Tests Only) PASSED.");

    // Verify DB answer is still empty after Run Code
    const ansAfterRun = await prisma.assessmentAnswer.findUnique({
        where: { assessmentQuestionId: question.id }
    });
    console.log("DB Answer after Run Code:", ansAfterRun ? "EXISTS" : "NONE (Correct - Run Code does not save)");
    if (ansAfterRun) {
        throw new Error("Run Code modified database answer state!");
    }

    // Test 3: Submit Code (Visible + Hidden test cases)
    console.log("\n--- Test 3: Submit Code (Visible + Hidden Tests) ---");
    const subRes = await submitCodingQuestion({
        attemptId,
        questionId: question.id,
        code: validJavaCode,
    });
    console.log("Submit Code response:", JSON.stringify(subRes, null, 2));

    if (!subRes.success || subRes.result?.status !== "accepted") {
        throw new Error(`Submit Code failed: ${subRes.error}`);
    }

    // Verify no hidden inputs/outputs returned in subRes
    const resKeys = Object.keys(subRes.result!);
    console.log("Submit result fields returned to client:", resKeys.join(", "));
    if (resKeys.includes("input") || resKeys.includes("expectedOutput") || resKeys.includes("actualOutput")) {
        throw new Error("SECURITY FAILURE: Test case inputs/outputs returned in Submit Code response!");
    }

    if (subRes.result?.visiblePassed !== 2 || subRes.result?.hiddenPassed !== 2 || subRes.result?.total !== 4) {
        throw new Error("Incorrect test count breakdown in Submit Code response");
    }
    console.log("✅ Submit Code (Visible + Hidden Tests) PASSED.");

    // Verify DB answer saved
    const ansAfterSub = await prisma.assessmentAnswer.findUnique({
        where: { assessmentQuestionId: question.id }
    });
    console.log("DB Answer score after Submit Code:", ansAfterSub?.score, "/", question.marks);
    if (ansAfterSub?.score !== 10) {
        throw new Error(`Expected DB score 10, got ${ansAfterSub?.score}`);
    }
    console.log("✅ DB Answer state PASSED.");

    // Test 4: Final Assessment Evaluation
    console.log("\n--- Test 4: Final Assessment Evaluation ---");
    const evalRes = await evaluateAssessment(attemptId);
    console.log("evaluateAssessment result:", JSON.stringify(evalRes, null, 2));

    if (evalRes.obtainedMarks !== 10 || evalRes.result !== "EXCELLENT") {
        throw new Error("Assessment evaluation failed to include Docker coding score");
    }
    console.log("✅ Final Assessment Evaluation PASSED.");

    // Cleanup
    await prisma.assessmentAttempt.delete({ where: { id: attemptId } });
    console.log("\n🎉 ALL E2E JAVA CODING FLOW TESTS PASSED!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
