import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { generateAssessmentQuestions } from "@/lib/assessment/generateAssessment";
import type { AssessmentSetup } from "@/components/assessment/types/assessment";

// ---------------------------------------------------------------------------
// POST /api/assessment/start
//
// Body: { setup: AssessmentSetup }
//
// Flow:
//   1. Create Test
//   2. Create AssessmentAttempt  (status = GENERATING)
//   3. Generate Questions         (AI)
//   4. Save Questions             (DB)
//   5. Mark attempt ACTIVE & return attemptId
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // ── Parse & validate body ─────────────────────────────────────────────
        const body = await req.json();
        const { setup } = body as { setup?: AssessmentSetup };

        if (!setup) {
            return NextResponse.json(
                { error: "All the details were not provided at the setup page" },
                { status: 400 }
            );
        }

        // if (!setup.role || !setup.difficulty || !setup.duration) {
        //     return NextResponse.json(
        //         { error: "setup must include role, difficulty, and duration" },
        //         { status: 400 }
        //     );
        // }

        // ── Step 1: Create Test ──────────────────────────────────────────
        const test = await prisma.test.create({
            data: {
                title: `${setup.role} Assessment`,
                role: setup.role,
                status: "IN_PROGRESS",
                difficulty: setup.difficulty.toUpperCase() as
                    | "EASY"
                    | "MEDIUM"
                    | "HARD",
                userId,
            },
        });

        // ── Step 2: Create AssessmentAttempt ──────────────────────────────────
        const attempt = await prisma.assessmentAttempt.create({
            data: {
                userId,
                testId: test.id,
                status: "GENERATING",
                durationMinutes: setup.duration,
            },
        });

        // ── Step 3: Generate Questions ────────────────────────────────────────
        let questions;
        try {
            questions = await generateAssessmentQuestions(setup);
            if (!questions || questions.length === 0) {
                throw new Error("No questions generated");
            }
        } catch (genError) {
            console.error("[assessment/start] Question generation failed:", genError);
            await prisma.assessmentAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
            await prisma.test.delete({ where: { id: test.id } }).catch(() => {});
            return NextResponse.json(
                { error: "Failed to generate assessment questions. Please try again." },
                { status: 500 }
            );
        }

        // ── Step 4: Save Questions ────────────────────────────────────────────
        await prisma.assessmentQuestion.createMany({
            data: questions.map((q) => ({
                questionText: q.questionText,
                questionType: q.questionType,
                topic: q.topic,
                metadata: q.metadata,
                difficulty: q.difficulty,
                timeLimit: q.timeLimit,
                marks: q.marks,
                assessmentAttemptId: attempt.id,
            })),
        });

        // Mark attempt as ACTIVE now that questions are ready
        await prisma.assessmentAttempt.update({
            where: { id: attempt.id },
            data: { status: "ACTIVE" },
        });

        // ── Step 5: Return attemptId ──────────────────────────────────────────
        return NextResponse.json(
            {
                attemptId: attempt.id,
                testId: test.id,
                totalQuestions: questions.length,
                message: "Assessment started successfully",
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("[assessment/start] Error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
