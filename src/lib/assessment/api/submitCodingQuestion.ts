"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "../../../../auth";

export interface SubmitCodingQuestionInput {
    attemptId: string;
    questionId: string;
    code: string;
}

export interface SubmitCodingQuestionResponse {
    success: boolean;
    error?: string;
    result?: {
        status: "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit_exceeded" | "memory_limit_exceeded" | "system_error";
        visiblePassed: number;
        visibleTotal: number;
        hiddenPassed: number;
        hiddenTotal: number;
        passed: number;
        total: number;
        error?: string;
    };
}

/**
 * Server Action: Submit Code
 *
 * Combines visible and hidden test cases SERVER-SIDE.
 * Sends test cases to Docker runner.
 * Calculates score based on execution correctness.
 * Saves submitted code in AssessmentAnswer.userAnswer and execution summary in AssessmentAnswer.aiEvaluation.
 * Returns ONLY safe aggregate statistics to the browser (never hidden inputs/outputs).
 */
export async function submitCodingQuestion({
    attemptId,
    questionId,
    code,
}: SubmitCodingQuestionInput): Promise<SubmitCodingQuestionResponse> {
    try {
        let userId: string | undefined;

        try {
            const session = await auth();
            userId = session?.user?.id;
        } catch (e) {
            // Outside Next.js HTTP request scope (e.g. CLI test environment)
        }

        // Verify attempt & question existence
        const question = await prisma.assessmentQuestion.findFirst({
            where: {
                id: questionId,
                assessmentAttemptId: attemptId,
                ...(userId ? { assessmentAttempt: { userId } } : {}),
            },
            select: {
                id: true,
                questionType: true,
                marks: true,
                metadata: true,
            },
        });

        if (!question || question.questionType !== "CODING") {
            return { success: false, error: "Coding question or attempt not found" };
        }

        const metadata = question.metadata as unknown as {
            language: string;
            visibleTestCases: { input: string; expectedOutput: string }[];
            hiddenTestCases: { input: string; expectedOutput: string }[];
        };

        const visibleTests = metadata.visibleTestCases || [];
        const hiddenTests = metadata.hiddenTestCases || [];
        const combinedTestCases = [...visibleTests, ...hiddenTests];

        if (combinedTestCases.length === 0) {
            return { success: false, error: "No test cases found for question" };
        }

        const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://localhost:3001";

        // Send combined test cases to Docker runner /judge
        const response = await fetch(`${CODE_RUNNER_URL}/judge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: metadata.language || "java",
                userCode: code,
                testCases: combinedTestCases,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `Runner error (${response.status}): ${errText}` };
        }

        const judgeResult = await response.json();

        // Process aggregate counts safely
        const visibleTotal = visibleTests.length;
        const hiddenTotal = hiddenTests.length;
        const total = combinedTestCases.length;

        let visiblePassed = 0;
        let hiddenPassed = 0;

        if (Array.isArray(judgeResult.results)) {
            const visibleResults = judgeResult.results.slice(0, visibleTotal);
            const hiddenResults = judgeResult.results.slice(visibleTotal);

            visiblePassed = visibleResults.filter((r: any) => r.passed).length;
            hiddenPassed = hiddenResults.filter((r: any) => r.passed).length;
        } else if (judgeResult.status === "accepted") {
            visiblePassed = visibleTotal;
            hiddenPassed = hiddenTotal;
        }

        const passed = visiblePassed + hiddenPassed;

        // Calculate score: proportional to test cases passed
        const score = total > 0 ? (passed / total) * question.marks : 0;

        // Save execution details into AssessmentAnswer
        const executionData = {
            type: "coding_execution",
            status: judgeResult.status,
            visiblePassed,
            visibleTotal,
            hiddenPassed,
            hiddenTotal,
            passed,
            total,
            error: judgeResult.error || null,
        };

        await prisma.assessmentAnswer.upsert({
            where: {
                assessmentQuestionId: questionId,
            },
            update: {
                userAnswer: code,
                score,
                aiEvaluation: executionData as Prisma.InputJsonValue,
                answeredAt: new Date(),
            },
            create: {
                assessmentAttemptId: attemptId,
                assessmentQuestionId: questionId,
                userAnswer: code,
                score,
                aiEvaluation: executionData as Prisma.InputJsonValue,
                answeredAt: new Date(),
            },
        });

        // Return ONLY safe aggregate stats to the browser
        return {
            success: true,
            result: {
                status: judgeResult.status,
                visiblePassed,
                visibleTotal,
                hiddenPassed,
                hiddenTotal,
                passed,
                total,
                error: judgeResult.error || undefined,
            },
        };
    } catch (err: any) {
        console.error("[submitCodingQuestion] Error:", err);
        return { success: false, error: err.message || "Submission failed" };
    }
}
