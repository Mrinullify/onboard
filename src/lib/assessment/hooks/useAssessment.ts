import { useState, useRef, useEffect, useCallback } from "react";
import { useAntiCheat } from "./useAntiCheat";
import { submitAssessment, saveAssessmentAnswer } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EnrichedQuestion } from "@/schemas/question";
import { useTimer } from "./useTimer";

interface UseAssessmentOptions {
    assessmentId: string;
    attemptId: string;
    questions: EnrichedQuestion[];
    durationMinutes: number;
    initialStrikes?: number;
    startedAt?: Date | string;
    initialAnswers?: Record<string, string>;
}

export function useAssessment({
    assessmentId,
    attemptId,
    questions,
    durationMinutes,
    initialStrikes = 0,
    startedAt,
    initialAnswers = {},
}: UseAssessmentOptions) {
    const router = useRouter();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Initialize answers state with initialAnswers mapped by both question.id and index
    const [answers, setAnswers] = useState<Record<string, string>>(() => {
        const initialMap: Record<string, string> = { ...initialAnswers };
        questions.forEach((q, idx) => {
            if (q.id && initialAnswers[q.id] !== undefined) {
                initialMap[String(idx)] = initialAnswers[q.id];
            } else if (initialAnswers[String(idx)] !== undefined && q.id) {
                initialMap[q.id] = initialAnswers[String(idx)];
            }
        });
        return initialMap;
    });

    const [passedQuestions, setPassedQuestions] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);

    // Refs for debouncing and tracking latest answers
    const answersRef = useRef(answers);
    answersRef.current = answers;

    const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const pendingAnswersRef = useRef<Record<string, string>>({});

    // Persist single answer helper
    const persistAnswer = useCallback(
        async (questionId: string, value: string) => {
            try {
                await saveAssessmentAnswer({
                    attemptId,
                    questionId,
                    userAnswer: value,
                });
            } catch (err) {
                console.error(`Failed to autosave answer for question ${questionId}:`, err);
            }
        },
        [attemptId]
    );

    // Flush any pending debounced answers
    const flushPending = useCallback(
        (targetQuestionId?: string) => {
            if (targetQuestionId) {
                if (debounceTimersRef.current[targetQuestionId]) {
                    clearTimeout(debounceTimersRef.current[targetQuestionId]);
                    delete debounceTimersRef.current[targetQuestionId];
                }
                if (pendingAnswersRef.current[targetQuestionId] !== undefined) {
                    const val = pendingAnswersRef.current[targetQuestionId];
                    delete pendingAnswersRef.current[targetQuestionId];
                    persistAnswer(targetQuestionId, val);
                }
            } else {
                // Flush all pending
                Object.keys(pendingAnswersRef.current).forEach((qId) => {
                    if (debounceTimersRef.current[qId]) {
                        clearTimeout(debounceTimersRef.current[qId]);
                        delete debounceTimersRef.current[qId];
                    }
                    const val = pendingAnswersRef.current[qId];
                    delete pendingAnswersRef.current[qId];
                    persistAnswer(qId, val);
                });
            }
        },
        [persistAnswer]
    );

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            Object.values(debounceTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    // Answer update with type-specific autosave strategy
    function setAnswer(questionIndex: number, value: string) {
        const q = questions[questionIndex];
        const qId = q?.id ?? String(questionIndex);

        // Immediate React state update for fast UI
        setAnswers((prev) => ({
            ...prev,
            [qId]: value,
            [String(questionIndex)]: value,
        }));

        if (q?.questionType === "MCQ") {
            // Immediate save for MCQ
            if (debounceTimersRef.current[qId]) {
                clearTimeout(debounceTimersRef.current[qId]);
                delete debounceTimersRef.current[qId];
            }
            delete pendingAnswersRef.current[qId];
            persistAnswer(qId, value);
        } else {
            // Debounced save for Scenario / Coding / text answers (750ms)
            pendingAnswersRef.current[qId] = value;
            if (debounceTimersRef.current[qId]) {
                clearTimeout(debounceTimersRef.current[qId]);
            }
            debounceTimersRef.current[qId] = setTimeout(() => {
                delete debounceTimersRef.current[qId];
                delete pendingAnswersRef.current[qId];
                persistAnswer(qId, value);
            }, 750);
        }
    }

    function handleNext() {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ?.id) {
            flushPending(currentQ.id);
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    }

    function handlePrevious() {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ?.id) {
            flushPending(currentQ.id);
        }
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    }

    function handleQuestionClick(index: number) {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ?.id) {
            flushPending(currentQ.id);
        }
        setCurrentQuestionIndex(index);
    }

    // Submit assessment
    async function handleSubmit() {
        if (isSubmitting) return;

        setIsSubmitting(true);
        flushPending();

        try {
            const res = await submitAssessment(attemptId, answersRef.current);

            if (res.success) {
                toast.success("Assessment submitted! Redirecting to results...");
                router.push(`/assessment/${attemptId}/result`);
            } else {
                toast.error(res.error || "Failed to submit assessment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Terminate assessment
    function handleTerminate() {
        flushPending();
        setIsTerminated(true);
        router.push("/dashboard");
    }

    // Timer
    const { timeLeft, formattedTime } = useTimer({
        durationSeconds: durationMinutes * 60,
        storageKey: `assessment-${attemptId}`,
        onTimeUp: handleSubmit,
    });

    // Anti-cheat
    const {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        strikes,
        isWindowFocused,
    } = useAntiCheat({
        attemptId,
        initialStrikes,
        onTerminate: handleTerminate,
        isActive: !isTerminated && timeLeft > 0,
    });

    return {
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex],
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
        isTerminated,
        handleSubmit,
    };
}