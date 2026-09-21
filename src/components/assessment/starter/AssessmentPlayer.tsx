"use client";

import { Clock3, AlertTriangle } from "lucide-react";
import { AssessmentQuestion } from "@prisma/client";
import QuestionRenderer from "./QuestionRenderer";
import AnswerRenderer from "./AnswerRenderer";
import { useState, useEffect, useCallback } from "react";
import { EnrichedQuestionsSchema } from "@/schemas/question";
import { useAssessment } from "@/lib/assessment/hooks/useAssessment";

interface AssessmentPlayerProps {
    assessmentId: string;
    attemptId: string;
    questions: AssessmentQuestion[];
    totQuestions: number;
    durationMinutes: number;
    startedAt: string;
    fullscreenStrikes: number;
    initialAnswers?: Record<string, string>;
}

export default function AssessmentPlayer({
    questions,
    assessmentId,
    attemptId,
    totQuestions,
    durationMinutes,
    startedAt,
    fullscreenStrikes,
    initialAnswers,
}: AssessmentPlayerProps) {
    const parsedQuestions = EnrichedQuestionsSchema.parse(questions);

    const {
        currentQuestionIndex,
        currentQuestion,
        answers,
        passedQuestions,
        setPassedQuestions,
        setAnswer,
        handleNext,
        handlePrevious,
        handleQuestionClick,
        timeLeft,
        formattedTime,
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        strikes,
        isWindowFocused,
        isSubmitting,
        handleSubmit,
    } = useAssessment({
        assessmentId,
        attemptId,
        questions: parsedQuestions,
        durationMinutes,
        startedAt,
        initialStrikes: fullscreenStrikes,
        initialAnswers,
    });

    // ── Beforeunload warning ──
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Your assessment is in progress. Are you sure you want to leave? All unsaved answers will be lost.";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // ── Derive palette state for each question ──
    const getQuestionStatus = (index: number): "current" | "answered" | "unanswered" => {
        if (index === currentQuestionIndex) return "current";
        const q = parsedQuestions[index];
        const ans = (q?.id && answers[q.id]) || answers[String(index)];
        if (ans && ans.trim() !== "") return "answered";
        return "unanswered";
    };

    const answeredCount = parsedQuestions.filter((q, i) => {
        const ans = (q?.id && answers[q.id]) || answers[String(i)];
        return ans && ans.trim() !== "";
    }).length;

    const currentQ = parsedQuestions[currentQuestionIndex];
    const currentAnswer = (currentQ?.id && answers[currentQ.id]) || answers[String(currentQuestionIndex)] || "";

    if (!isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
                <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Fullscreen Required</h2>
                    <p className="mt-3 text-sm text-slate-400">
                        This assessment requires fullscreen mode to prevent cheating and tab switching. Exiting fullscreen or navigating away will count as a strike.
                    </p>
                    {strikes > 0 && (
                        <p className="mt-2 text-sm font-semibold text-amber-500">
                            Current strikes: {strikes} / 3
                        </p>
                    )}
                    <button
                        onClick={enterFullscreen}
                        className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition duration-200 hover:bg-blue-500 hover:shadow-blue-600/20 active:scale-95"
                    >
                        Enter Fullscreen & Resume
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">

            {/* ── Header ── */}
            <header className="shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Left: title */}
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Backend Developer Assessment</h1>
                        <p className="mt-0.5 text-xs text-slate-400">
                            {answeredCount} / {totQuestions} answered — read each question carefully
                        </p>
                    </div>

                    {/* Right: timer */}
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5">
                            <div className="flex items-center gap-2 text-blue-300">
                                <Clock3 size={15} />
                                <span className="text-xs font-medium uppercase tracking-wider">Time Remaining</span>
                            </div>
                            <p className="mt-1 text-center text-2xl font-bold tabular-nums tracking-widest text-blue-100">
                                {formattedTime}
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-xl bg-red-600/90 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Assessment"}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="grid min-h-0 flex-1 grid-cols-12 gap-0">

                {/* Left: Question panel (7 cols) */}
                <section className="col-span-7 flex flex-col overflow-hidden border-r border-slate-800">
                    {/* Question header bar */}
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-8 py-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                Question
                            </p>
                            <p className="mt-0.5 text-lg font-bold">
                                <span className="text-slate-400">{currentQuestionIndex + 1}</span>
                                <span className="mx-1 text-slate-600">/</span>
                                <span className="text-slate-500 text-base">{totQuestions}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Difficulty badge */}
                            {currentQuestion.difficulty && (
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${currentQuestion.difficulty === "HARD"
                                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                    : currentQuestion.difficulty === "MEDIUM"
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                        : "bg-green-500/15 text-green-400 border border-green-500/30"
                                    }`}>
                                    {currentQuestion.difficulty.toLowerCase()}
                                </span>
                            )}
                            <span className="rounded-full bg-blue-600/80 border border-blue-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                                {currentQuestion.questionType.replace("_", " ")}
                            </span>
                        </div>
                    </div>

                    {/* Question body — scrollable */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                        <QuestionRenderer
                            question={currentQuestion}
                            answer={currentAnswer}
                            setAnswer={(value: string) => setAnswer(currentQuestionIndex, value)}
                        />
                    </div>

                    {/* Navigation footer */}
                    <div className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/50 px-8 py-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-medium transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            ← Previous
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={currentQuestionIndex === parsedQuestions.length - 1}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                </section>

                {/* Right: Answer panel + palette (5 cols) */}
                <aside className="col-span-5 flex flex-col overflow-hidden bg-slate-950">

                    {/* ── Answer Renderer (top, flexible height) ── */}
                    <div className="min-h-0 flex-1 p-5">
                        <AnswerRenderer
                            question={currentQuestion}
                            answer={currentAnswer}
                            setAnswer={(value: string) => setAnswer(currentQuestionIndex, value)}
                            isPassed={!!passedQuestions[String(currentQuestionIndex)]}
                            onPass={() => setPassedQuestions(prev => ({ ...prev, [String(currentQuestionIndex)]: true }))}
                            onFail={() => setPassedQuestions(prev => ({ ...prev, [String(currentQuestionIndex)]: false }))}
                            attemptId={attemptId}
                        />
                    </div>

                    {/* ── Palette + Legend (bottom, fixed) ── */}
                    <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/60 p-5 space-y-4">

                        {/* Question palette */}
                        <div>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Question Palette
                            </h3>
                            <div className="grid grid-cols-8 gap-2">
                                {parsedQuestions.map((_, index) => {
                                    const status = getQuestionStatus(index);
                                    const isPassed = !!passedQuestions[String(index)];
                                    return (
                                        <button
                                            onClick={() => handleQuestionClick(index)}
                                            key={index}
                                            title={`Question ${index + 1}${isPassed ? " (Solved)" : status === "answered" ? " (answered)" : ""}`}
                                            className={`aspect-square rounded-lg text-xs font-bold transition-all duration-200 relative flex items-center justify-center ${
                                                isPassed
                                                    ? status === "current"
                                                        ? "bg-green-600 text-white shadow-lg shadow-green-500/30 scale-110 border-2 border-white"
                                                        : "bg-green-600 text-white shadow-md shadow-green-900/20"
                                                    : status === "current"
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                                                    : status === "answered"
                                                    ? "bg-green-600/40 border border-green-500/30 text-white"
                                                    : "border border-slate-700 bg-slate-900 text-slate-400 hover:border-blue-500/60 hover:text-white"
                                            }`}
                                        >
                                            {isPassed ? (
                                                <span className="flex items-center justify-center text-sm font-black">✓</span>
                                            ) : (
                                                index + 1
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Legend
                            </h3>
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-blue-600" />
                                    <span>Current</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-green-600" />
                                    <span>Solved / Correct</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-green-600/40 border border-green-500/30" />
                                    <span>Answered (Not verified)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded border border-slate-700 bg-slate-900" />
                                    <span>Not Answered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
