"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../../auth";
import { evaluateAssessment } from "./evaluate";

export async function incrementFullscreenStrikes(attemptId: string) {
    try {
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            select: { fullscreenStrikes: true },
        });

        if (!attempt) {
            throw new Error("Assessment attempt not found");
        }

        const newStrikes = attempt.fullscreenStrikes + 1;
        const shouldTerminate = newStrikes >= 3;

        const updatedAttempt = await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: {
                fullscreenStrikes: newStrikes,
                status: shouldTerminate ? "TERMINATED" : undefined,
                endedAt: shouldTerminate ? new Date() : undefined,
            },
        });

        return {
            success: true,
            strikes: updatedAttempt.fullscreenStrikes,
            status: updatedAttempt.status,
            terminated: shouldTerminate,
        };
    } catch (error) {
        console.error("Error incrementing fullscreen strikes:", error);
        return { success: false, error: "Failed to increment strikes" };
    }
}

export async function saveAssessmentAnswer({
    attemptId,
    questionId,
    userAnswer,
    timeTaken,
}: {
    attemptId: string;
    questionId: string;
    userAnswer: string;
    timeTaken?: number;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify question belongs to attempt and attempt belongs to user
        const question = await prisma.assessmentQuestion.findFirst({
            where: {
                id: questionId,
                assessmentAttemptId: attemptId,
                assessmentAttempt: {
                    userId: session.user.id,
                },
            },
            select: { id: true },
        });

        if (!question) {
            return { success: false, error: "Question or attempt not found" };
        }

        await prisma.assessmentAnswer.upsert({
            where: {
                assessmentQuestionId: questionId,
            },
            update: {
                userAnswer,
                timeTaken: timeTaken ?? undefined,
                answeredAt: new Date(),
            },
            create: {
                assessmentAttemptId: attemptId,
                assessmentQuestionId: questionId,
                userAnswer,
                timeTaken: timeTaken ?? undefined,
                answeredAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error saving assessment answer:", error);
        return { success: false, error: "Failed to save answer" };
    }
}

export async function submitAssessment(
    attemptId: string,
    answers?: Record<string, string>
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        // 1. Fetch attempt and questions to verify ownership
        const attempt = await prisma.assessmentAttempt.findFirst({
            where: {
                id: attemptId,
                userId: session.user.id,
            },
            include: {
                questions: {
                    select: { id: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Assessment attempt not found" };
        }

        // 2. Final sync of any current answers if provided
        if (answers && Object.keys(answers).length > 0) {
            const answerPromises = attempt.questions.map((question, index) => {
                const answerValue = answers[question.id] ?? answers[String(index)];
                if (answerValue !== undefined) {
                    return prisma.assessmentAnswer.upsert({
                        where: {
                            assessmentQuestionId: question.id,
                        },
                        update: {
                            userAnswer: answerValue,
                            answeredAt: new Date(),
                        },
                        create: {
                            assessmentAttemptId: attemptId,
                            assessmentQuestionId: question.id,
                            userAnswer: answerValue,
                            answeredAt: new Date(),
                        },
                    });
                }
                return null;
            }).filter(Boolean);

            await Promise.all(answerPromises);
        }

        // 3. Evaluate all answers and mark attempt as COMPLETED
        const evaluationResult = await evaluateAssessment(attemptId);

        return {
            success: true,
            evaluation: evaluationResult,
        };
    } catch (error) {
        console.error("Error submitting assessment:", error);
        return { success: false, error: "Failed to submit assessment" };
    }
}
