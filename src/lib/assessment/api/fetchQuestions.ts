import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// fetchQuestions
//
// Used in Server Components — queries the DB directly by attemptId.
// Strips hiddenTestCases from CODING question metadata to prevent exposure
// to client browser / React state.
// ---------------------------------------------------------------------------

export async function fetchQuestions(
    attemptId: string,
    userId?: string
) {
    if (!attemptId) {
        throw new Error("attemptId is required");
    }

    const [questions, attempt, existingAnswers] = await Promise.all([
        prisma.assessmentQuestion.findMany({
            where: { assessmentAttemptId: attemptId },
            orderBy: { createdAt: "asc" },
        }),
        prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            select: {
                userId: true,
                testId: true,
                durationMinutes: true,
                startedAt: true,
                fullscreenStrikes: true,
                status: true,
            },
        }),
        prisma.assessmentAnswer.findMany({
            where: { assessmentAttemptId: attemptId },
            select: {
                assessmentQuestionId: true,
                userAnswer: true,
            },
        }),
    ]);

    if (!attempt) {
        throw new Error("Assessment attempt not found");
    }

    if (userId && attempt.userId !== userId) {
        throw new Error("Unauthorized to access this assessment attempt");
    }

    // Sanitize CODING question metadata: remove hiddenTestCases from payload
    const sanitizedQuestions = questions.map((q) => {
        if (q.questionType === "CODING" && q.metadata && typeof q.metadata === "object") {
            const meta = { ...(q.metadata as Record<string, any>) };
            delete meta.hiddenTestCases;
            return {
                ...q,
                metadata: meta,
            };
        }
        return q;
    });

    // Build initialAnswers mapping questionId -> userAnswer
    const initialAnswers: Record<string, string> = {};
    for (const ans of existingAnswers) {
        if (ans.userAnswer !== null && ans.userAnswer !== undefined) {
            initialAnswers[ans.assessmentQuestionId] = ans.userAnswer;
        }
    }

    return {
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length,
        attemptId,
        assessmentId: attempt.testId,
        durationMinutes: attempt.durationMinutes,
        startedAt: attempt.startedAt.toISOString(),
        fullscreenStrikes: attempt.fullscreenStrikes,
        initialAnswers,
        status: attempt.status,
    };
}