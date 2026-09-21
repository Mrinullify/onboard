"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { groq } from "../groq";
import { getResultFromPercentage } from "./constants";

// ─── Metadata interfaces ──────────────────────────────────────────────────────

interface MCQMetadata {
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface RubricItem {
    criterion: string;
    points: number;
    description?: string;
}

interface ScenarioMetadata {
    evaluationCriteria: string[];
    rubric: RubricItem[];
}

interface CodingMetadata {
    language: string;
    visibleTestCases: { input: string; expectedOutput: string }[];
    hiddenTestCases: { input: string; expectedOutput: string }[];
}

// ─── Scenario AI evaluation ───────────────────────────────────────────────────

interface ScenarioEvalResult {
    score: number;
    feedback: string;
    aiEvaluation: Record<string, unknown>;
}

/**
 * Calls Groq to evaluate a single scenario answer.
 * Returns a score clamped to [0, maxMarks], feedback, and raw aiEvaluation.
 * Never throws — returns a zero score with an error note on failure.
 */
async function evaluateScenarioAnswer(
    questionText: string,
    metadata: ScenarioMetadata,
    userAnswer: string,
    maxMarks: number
): Promise<ScenarioEvalResult> {
    const rubricText = metadata.rubric
        .map((r) => `- ${r.criterion} (${r.points} pts): ${r.description ?? ""}`)
        .join("\n");

    const criteriaText = metadata.evaluationCriteria.join("\n- ");

    const prompt = `You are an expert technical assessor. Evaluate the candidate's answer below.

## Question
${questionText}

## Evaluation Criteria
- ${criteriaText}

## Rubric (Total: ${maxMarks} points)
${rubricText}

## Candidate's Answer
${userAnswer}

Return a JSON object with exactly these fields:
{
  "score": <number between 0 and ${maxMarks}, integers or 0.5 increments only>,
  "feedback": "<2–4 sentence constructive feedback explaining the score>",
  "criterionScores": [
    { "criterion": "<criterion name>", "pointsAwarded": <number>, "comment": "<brief comment>" }
  ]
}

Rules:
- score must be between 0 and ${maxMarks} inclusive.
- Do not exceed ${maxMarks}.
- Be strict but fair. A vague or irrelevant answer scores 0–1.
- Return ONLY valid JSON. No markdown. No explanation outside JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert technical assessor. Return only valid JSON. Never include markdown or extra text.",
                },
                { role: "user", content: prompt },
            ],
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("Groq returned an empty response for scenario evaluation.");

        const parsed = JSON.parse(content) as {
            score?: unknown;
            feedback?: unknown;
            criterionScores?: unknown;
        };

        // Validate and clamp score
        const rawScore = Number(parsed.score);
        if (isNaN(rawScore)) throw new Error(`Groq returned non-numeric score: ${parsed.score}`);
        const score = Math.min(Math.max(Math.round(rawScore * 2) / 2, 0), maxMarks); // clamp + round to 0.5

        const feedback =
            typeof parsed.feedback === "string" && parsed.feedback.trim()
                ? parsed.feedback.trim()
                : "Evaluated by AI.";

        return {
            score,
            feedback,
            aiEvaluation: parsed as Record<string, unknown>,
        };
    } catch (err) {
        console.error("[evaluateScenarioAnswer] Error:", err);
        return {
            score: 0,
            feedback: "AI evaluation failed. Please review manually.",
            aiEvaluation: { error: String(err) },
        };
    }
}

// ─── Main evaluation function ─────────────────────────────────────────────────

/**
 * Evaluates all answers for an assessment attempt.
 *
 * MCQ      → deterministic exact-match scoring
 * SCENARIO → Groq AI evaluation against rubric/evaluationCriteria
 * CODING   → Docker execution score (from submitCodingQuestion or fallback Docker execution)
 *
 * All score writes + attempt stat update run inside a single Prisma
 * transaction so results are never partially committed.
 */
export async function evaluateAssessment(attemptId: string) {
    // 1. Fetch all questions with their answers
    const questions = await prisma.assessmentQuestion.findMany({
        where: { assessmentAttemptId: attemptId },
        include: { answers: true },
    });

    if (questions.length === 0) {
        throw new Error(`No questions found for attempt ${attemptId}`);
    }

    // 2. Score each question
    type AnswerUpdate = {
        answerId: string;
        score: number;
        feedback?: string;
        aiEvaluation?: Record<string, unknown>;
    };

    const answerUpdates: AnswerUpdate[] = [];

    let totalMarks = 0;
    let obtainedMarks = 0;

    for (const question of questions) {
        totalMarks += question.marks;

        const answer = question.answers;

        // ── MCQ ──────────────────────────────────────────────────────────
        if (question.questionType === "MCQ") {
            if (!answer?.userAnswer) {
                if (answer) {
                    answerUpdates.push({ answerId: answer.id, score: 0 });
                }
                continue;
            }

            const metadata = question.metadata as unknown as MCQMetadata;
            const correctAnswer = metadata?.correctAnswer?.trim();
            const userAnswer = answer.userAnswer.trim();

            const isCorrect =
                correctAnswer !== undefined &&
                userAnswer.toLowerCase() === correctAnswer.toLowerCase();

            const score = isCorrect ? question.marks : 0;
            obtainedMarks += score;
            answerUpdates.push({ answerId: answer.id, score });
            continue;
        }

        // ── SCENARIO ──────────────────────────────────────────────────────
        if (question.questionType === "SCENARIO") {
            if (!answer?.userAnswer?.trim()) {
                if (answer) {
                    answerUpdates.push({
                        answerId: answer.id,
                        score: 0,
                        feedback: "Not answered.",
                        aiEvaluation: { skipped: true, reason: "No answer provided" },
                    });
                }
                continue;
            }

            const metadata = question.metadata as unknown as ScenarioMetadata;
            console.log(`[evaluateAssessment] Calling Groq for SCENARIO answer (question ${question.id})...`);

            const evalResult = await evaluateScenarioAnswer(
                question.questionText,
                metadata,
                answer.userAnswer,
                question.marks
            );

            obtainedMarks += evalResult.score;
            answerUpdates.push({
                answerId: answer.id,
                score: evalResult.score,
                feedback: evalResult.feedback,
                aiEvaluation: evalResult.aiEvaluation,
            });
            continue;
        }

        // ── CODING ────────────────────────────────────────────────────────
        if (question.questionType === "CODING") {
            if (!answer || !answer.userAnswer?.trim()) {
                if (answer) {
                    answerUpdates.push({ answerId: answer.id, score: 0 });
                }
                continue;
            }

            // Use already saved score if candidate executed Submit Code
            if (typeof answer.score === "number") {
                obtainedMarks += answer.score;
                continue;
            }

            // Fallback: candidate saved code but didn't click Submit Code -> run Docker /judge
            try {
                const metadata = question.metadata as unknown as CodingMetadata;
                const combinedTests = [
                    ...(metadata.visibleTestCases || []),
                    ...(metadata.hiddenTestCases || []),
                ];

                if (combinedTests.length > 0) {
                    const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://localhost:3001";
                    const resp = await fetch(`${CODE_RUNNER_URL}/judge`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            language: metadata.language || "java",
                            userCode: answer.userAnswer,
                            testCases: combinedTests,
                        }),
                    });

                    if (resp.ok) {
                        const jRes = await resp.json();
                        let passedCount = 0;
                        if (Array.isArray(jRes.results)) {
                            passedCount = jRes.results.filter((r: any) => r.passed).length;
                        } else if (jRes.status === "accepted") {
                            passedCount = combinedTests.length;
                        }
                        const score = (passedCount / combinedTests.length) * question.marks;
                        obtainedMarks += score;
                        answerUpdates.push({ answerId: answer.id, score });
                        continue;
                    }
                }
            } catch (err) {
                console.error("[evaluateAssessment] Coding fallback evaluation failed:", err);
            }

            answerUpdates.push({ answerId: answer.id, score: 0 });
            continue;
        }
    }

    // 3. Recalculate percentage + result
    const percentage =
        totalMarks > 0
            ? Math.round((obtainedMarks / totalMarks) * 10000) / 100
            : 0;

    const result = getResultFromPercentage(percentage);

    // 4. Write everything atomically
    await prisma.$transaction(
        async (tx) => {
            for (const update of answerUpdates) {
                await tx.assessmentAnswer.update({
                    where: { id: update.answerId },
                    data: {
                        score: update.score,
                        ...(update.feedback !== undefined && { feedback: update.feedback }),
                        ...(update.aiEvaluation !== undefined && {
                            aiEvaluation: update.aiEvaluation as Prisma.InputJsonValue,
                        }),
                    },
                });
            }

            await tx.assessmentAttempt.update({
                where: { id: attemptId },
                data: {
                    totalQuestions: questions.length,
                    totalMarks,
                    obtainedMarks,
                    percentage,
                    result,
                    status: "COMPLETED",
                    endedAt: new Date(),
                },
            });
        },
        { timeout: 30000 }
    );

    return {
        totalQuestions: questions.length,
        totalMarks,
        obtainedMarks,
        percentage,
        result,
    };
}
