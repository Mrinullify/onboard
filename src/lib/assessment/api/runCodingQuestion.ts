"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../../../auth";

export interface RunCodingQuestionInput {
    attemptId: string;
    questionId: string;
    code: string;
}

export interface TestCaseResult {
    index: number;
    passed: boolean;
    status: string;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
}

export interface RunCodingQuestionResponse {
    success: boolean;
    error?: string;
    result?: {
        status: "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit_exceeded" | "memory_limit_exceeded" | "system_error";
        passed: number;
        total: number;
        results?: TestCaseResult[];
        error?: string;
    };
}

/**
 * Server Action: Run Code
 *
 * Runs ONLY visible test cases for candidate debugging/feedback.
 * Does NOT score the question or update database answer state.
 * Never retrieves or sends hidden test cases.
 */
export async function runCodingQuestion({
    attemptId,
    questionId,
    code,
}: RunCodingQuestionInput): Promise<RunCodingQuestionResponse> {
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
                metadata: true,
            },
        });

        if (!question || question.questionType !== "CODING") {
            return { success: false, error: "Coding question or attempt not found" };
        }

        const metadata = question.metadata as unknown as {
            language: string;
            visibleTestCases: { input: string; expectedOutput: string }[];
        };

        if (!metadata?.visibleTestCases || !Array.isArray(metadata.visibleTestCases) || metadata.visibleTestCases.length === 0) {
            return { success: false, error: "Question contains no visible test cases" };
        }

        const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://localhost:3001";

        // Send ONLY visible test cases to Docker runner /judge
        const response = await fetch(`${CODE_RUNNER_URL}/judge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: metadata.language || "java",
                userCode: code,
                testCases: metadata.visibleTestCases,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `Runner error (${response.status}): ${errText}` };
        }

        const judgeResult = await response.json();
        return { success: true, result: judgeResult };
    } catch (err: any) {
        console.error("[runCodingQuestion] Error:", err);
        return { success: false, error: err.message || "Execution failed" };
    }
}
