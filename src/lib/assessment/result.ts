"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../../auth";

// ─── Metadata shapes (read-only, mirrors what generateAssessment stores) ─────

interface MCQMetadata {
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface ScenarioMetadata {
    evaluationCriteria: string[];
    rubric: { criterion: string; points: number; description?: string }[];
}

// ─── Public return types ─────────────────────────────────────────────────────

export interface ResultQuestion {
    id: string;
    questionType: "MCQ" | "SCENARIO" | "CODING";
    difficulty: string;
    topic: string;
    questionText: string;
    marks: number;

    // MCQ-specific
    options: string[] | null;
    correctAnswer: string | null;
    explanation: string | null;

    // SCENARIO-specific
    evaluationCriteria: string[] | null;
    rubric: { criterion: string; points: number; description?: string }[] | null;

    // User's answer & score (from AssessmentAnswer)
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
}

export interface AssessmentResultData {
    attemptId: string;
    status: string;
    totalQuestions: number;
    totalMarks: number;
    obtainedMarks: number | null;
    percentage: number | null;
    result: string | null;
    startedAt: string;       // ISO string — safe for server→client
    endedAt: string | null;
    questions: ResultQuestion[];
}

// ─── Server Action ───────────────────────────────────────────────────────────

/**
 * Read-only server action that returns everything needed to render the
 * assessment result page.
 *
 * - Verifies the attempt belongs to the authenticated user.
 * - Does NOT recalculate scores — uses the already-populated DB values.
 * - Returns `null` if the attempt is not found or not owned by the user.
 */
export async function getAssessmentResult(
    attemptId: string
): Promise<{ success: true; data: AssessmentResultData } | { success: false; error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const attempt = await prisma.assessmentAttempt.findFirst({
            where: {
                id: attemptId,
                userId: session.user.id,
            },
            include: {
                questions: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        answers: {
                            select: {
                                userAnswer: true,
                                score: true,
                                feedback: true,
                            },
                        },
                    },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Assessment attempt not found" };
        }

        // Map questions → ResultQuestion[]
        const questions: ResultQuestion[] = attempt.questions.map((q) => {
            const answer = q.answers;
            const base: ResultQuestion = {
                id: q.id,
                questionType: q.questionType as ResultQuestion["questionType"],
                difficulty: q.difficulty,
                topic: q.topic,
                questionText: q.questionText,
                marks: q.marks,
                options: null,
                correctAnswer: null,
                explanation: null,
                evaluationCriteria: null,
                rubric: null,
                userAnswer: answer?.userAnswer ?? null,
                score: answer?.score ?? null,
                feedback: answer?.feedback ?? null,
            };

            if (q.questionType === "MCQ") {
                const meta = q.metadata as unknown as MCQMetadata;
                base.options = meta?.options ?? null;
                base.correctAnswer = meta?.correctAnswer ?? null;
                base.explanation = meta?.explanation ?? null;
            } else if (q.questionType === "SCENARIO") {
                const meta = q.metadata as unknown as ScenarioMetadata;
                base.evaluationCriteria = meta?.evaluationCriteria ?? null;
                base.rubric = meta?.rubric ?? null;
            }
            // CODING: metadata fields not surfaced yet — extend when needed

            return base;
        });

        const data: AssessmentResultData = {
            attemptId: attempt.id,
            status: attempt.status,
            totalQuestions: attempt.totalQuestions,
            totalMarks: attempt.totalMarks,
            obtainedMarks: attempt.obtainedMarks,
            percentage: attempt.percentage,
            result: attempt.result,
            startedAt: attempt.startedAt.toISOString(),
            endedAt: attempt.endedAt?.toISOString() ?? null,
            questions,
        };

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching assessment result:", error);
        return { success: false, error: "Failed to fetch assessment result" };
    }
}
