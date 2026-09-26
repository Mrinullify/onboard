"use client";

import { EnrichedQuestion } from "@/schemas/question";
import { Mic, Play, Send, Loader2, CheckCircle2, XCircle, AlertTriangle, Terminal } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { runCodingQuestion, RunCodingQuestionResponse } from "@/lib/assessment/api/runCodingQuestion";
import { submitCodingQuestion, SubmitCodingQuestionResponse } from "@/lib/assessment/api/submitCodingQuestion";
import { toast } from "sonner";

// Monaco must be dynamically imported (no SSR) since it's browser-only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
    question: EnrichedQuestion;
    answer: string;
    setAnswer: (value: string) => void;
    isPassed: boolean;
    onPass: () => void;
    onFail: () => void;
    attemptId?: string;
}

// Maps common language strings to Monaco language identifiers
function toMonacoLanguage(lang: string): string {
    const map: Record<string, string> = {
        python: "python",
        javascript: "javascript",
        typescript: "typescript",
        java: "java",
        "c++": "cpp",
        cpp: "cpp",
        c: "c",
    };
    return map[lang?.toLowerCase()] ?? "plaintext";
}

function formatPreText(text?: string): string {
    if (!text) return "";
    return text
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\/r\/n/g, "\n")
        .replace(/\/n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
}

export interface ExecutionData {
    status: "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit_exceeded" | "memory_limit_exceeded" | "system_error";
    passed: number;
    total: number;
    results?: {
        index: number;
        passed: boolean;
        status: string;
        input?: string;
        expectedOutput?: string;
        actualOutput?: string;
        error?: string;
    }[];
    visiblePassed?: number;
    visibleTotal?: number;
    hiddenPassed?: number;
    hiddenTotal?: number;
    error?: string;
}

type ExecutionResult = {
    mode: "run" | "submit";
    data: ExecutionData;
};

export default function AnswerRenderer({
    question,
    answer,
    setAnswer,
    isPassed,
    onPass,
    onFail,
    attemptId,
}: Props) {
    const { questionType } = question;

    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

    // ─── Run Code handler (Visible test cases only) ───
    const handleRunCode = async () => {
        if (!question.id || !attemptId) {
            toast.error("Missing question or attempt context");
            return;
        }

        const metadata = question.metadata as any;
        const currentCode = answer || metadata.starterCode || "";

        setIsRunning(true);
        setExecutionResult(null);

        try {
            const res = await runCodingQuestion({
                attemptId,
                questionId: question.id,
                code: currentCode,
            });

            if (res.success && res.result) {
                const data = {
                    ...res.result,
                    passed: res.result.passed ?? 0,
                    total: res.result.total ?? metadata?.visibleTestCases?.length ?? 0,
                };
                setExecutionResult({ mode: "run", data });
            } else {
                toast.error(res.error || "Failed to execute code");
                setExecutionResult({
                    mode: "run",
                    data: {
                        status: "system_error",
                        passed: 0,
                        total: metadata?.visibleTestCases?.length ?? 0,
                        error: res.error || "Execution failed",
                    },
                });
            }
        } catch (err: any) {
            toast.error("Failed to run code");
            setExecutionResult({
                mode: "run",
                data: {
                    status: "system_error",
                    passed: 0,
                    total: (question.metadata as any)?.visibleTestCases?.length ?? 0,
                    error: err.message || "Execution error",
                },
            });
        } finally {
            setIsRunning(false);
        }
    };

    // ─── Submit Code handler (Visible + Hidden test cases) ───
    const handleSubmitCode = async () => {
        if (!question.id || !attemptId) {
            toast.error("Missing question or attempt context");
            return;
        }

        const metadata = question.metadata as any;
        const currentCode = answer || metadata.starterCode || "";

        setIsSubmitting(true);
        setExecutionResult(null);

        try {
            const res = await submitCodingQuestion({
                attemptId,
                questionId: question.id,
                code: currentCode,
            });

            if (res.success && res.result) {
                setExecutionResult({ mode: "submit", data: res.result });

                if (res.result.status === "accepted") {
                    onPass();
                    toast.success("All test cases passed! Question marked as solved.");
                } else {
                    onFail();
                    toast.error(`Submission status: ${res.result.status.replace("_", " ")}`);
                }

                // Ensure code is written to parent state
                if (!answer) {
                    setAnswer(currentCode);
                }
            } else {
                onFail();
                toast.error(res.error || "Failed to submit code");
            }
        } catch (err: any) {
            onFail();
            toast.error("Failed to submit code");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── MCQ Renderer ─── */
    if (questionType === "MCQ") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                {answer ? (
                    <>
                        <p className="text-sm font-medium text-green-400">Option selected ✓</p>
                        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-6 py-3">
                            <span className="text-base font-semibold text-green-300">{answer}</span>
                        </div>
                        <p className="text-xs text-slate-500">Click another option to change your selection.</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium text-slate-300">Pick an option</p>
                        <p className="text-xs text-slate-500">
                            Select one of the options on the left to record your answer.
                        </p>
                    </>
                )}
            </div>
        );
    }

    /* ─── CODING Renderer ─── */
    if (questionType === "CODING") {
        const metadata = question.metadata as any;
        const lang = toMonacoLanguage(metadata.language);
        const starterCode = metadata.starterCode ?? "";

        return (
            <div className="flex h-full flex-col gap-3 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Your Solution
                        </p>
                        {isPassed && (
                            <span className="flex items-center gap-1 rounded bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-[10px] font-medium text-green-400">
                                <CheckCircle2 size={11} /> Solved
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs uppercase tracking-wide text-slate-300 font-mono">
                            {metadata.language}
                        </span>

                        {/* Run Code Button */}
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning || isSubmitting}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:border-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 size={13} className="animate-spin text-blue-400" />
                                    <span>Running...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={13} className="text-blue-400 fill-current" />
                                    <span>Run Code</span>
                                </>
                            )}
                        </button>

                        {/* Submit Code Button */}
                        <button
                            onClick={handleSubmitCode}
                            disabled={isRunning || isSubmitting}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/40 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={12} />
                                    <span>Submit Code</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Monaco Editor */}
                <div className="min-h-0 flex-[3] overflow-hidden rounded-xl border border-slate-700">
                    <MonacoEditor
                        height="100%"
                        language={lang}
                        value={answer || starterCode}
                        onChange={(val) => setAnswer(val ?? "")}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            wordWrap: "on",
                            tabSize: 4,
                            padding: { top: 12, bottom: 12 },
                            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                            fontLigatures: true,
                        }}
                    />
                </div>

                {/* Console / Output Panel */}
                <div className="min-h-0 flex-[2] flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-2 text-xs font-medium text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Terminal size={13} />
                            <span>
                                {executionResult?.mode === "submit" ? "Submission Results" : "Run Code Results"}
                            </span>
                        </div>

                        {executionResult && (
                            <span className={`font-semibold uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded border ${
                                executionResult.data.status === "accepted"
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                    : executionResult.data.status === "time_limit_exceeded" || executionResult.data.status === "memory_limit_exceeded"
                                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                        : "bg-red-500/15 border-red-500/30 text-red-400"
                            }`}>
                                {executionResult.mode === "run"
                                    ? executionResult.data.status === "accepted"
                                        ? `Accepted (${executionResult.data.passed}/${executionResult.data.total} Passed)`
                                        : executionResult.data.status === "wrong_answer"
                                            ? `${executionResult.data.passed}/${executionResult.data.total} Test Cases Passed`
                                            : executionResult.data.status.replace("_", " ")
                                    : executionResult.data.status.replace("_", " ")
                                }
                            </span>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3">
                        {!executionResult && !isRunning && !isSubmitting && (
                            <div className="flex h-full items-center justify-center text-slate-600 italic text-center px-4 font-sans">
                                Click &quot;Run Code&quot; to test visible cases, or &quot;Submit Code&quot; to test all cases and record your score.
                            </div>
                        )}

                        {(isRunning || isSubmitting) && (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500 font-sans">
                                <Loader2 className="animate-spin text-emerald-400" size={20} />
                                <span>{isRunning ? "Testing visible test cases..." : "Testing all test cases..."}</span>
                            </div>
                        )}

                        {executionResult && (
                            <>
                                {/* MODE 1: Run Code Output (Visible Tests Only) */}
                                {executionResult.mode === "run" && (
                                    <div className="space-y-3 font-sans">
                                        {/* Summary Banner for Run Code */}
                                        {executionResult.data.status === "accepted" && (
                                            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs flex items-center justify-between">
                                                <span className="font-semibold">✓ Accepted — All sample test cases passed!</span>
                                                <span className="font-bold">{executionResult.data.passed} / {executionResult.data.total} Passed</span>
                                            </div>
                                        )}

                                        {executionResult.data.status === "wrong_answer" && (
                                            <div className={`p-3 rounded-lg border font-mono text-xs flex items-center justify-between ${
                                                executionResult.data.passed > 0
                                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                                    : "border-red-500/30 bg-red-500/10 text-red-300"
                                            }`}>
                                                <span className="font-semibold">
                                                    {executionResult.data.passed > 0
                                                        ? `⚠️ ${executionResult.data.passed} / ${executionResult.data.total} sample test cases passed`
                                                        : `✗ 0 / ${executionResult.data.total} sample test cases passed`}
                                                </span>
                                                <span className="font-bold">{executionResult.data.passed} / {executionResult.data.total} Passed</span>
                                            </div>
                                        )}

                                        {/* Compile Error Box */}
                                        {executionResult.data.status === "compile_error" && (
                                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                                    <AlertTriangle size={15} />
                                                    <span>Compilation Error</span>
                                                </div>
                                                <pre className="whitespace-pre-wrap text-red-300 leading-5 text-[11px] font-mono overflow-x-auto">
                                                    {executionResult.data.error || "Compilation failed."}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Runtime Error Box */}
                                        {executionResult.data.status === "runtime_error" && (!executionResult.data.results || executionResult.data.results.length === 0) && (
                                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                                    <AlertTriangle size={15} />
                                                    <span>Runtime Error</span>
                                                </div>
                                                <pre className="whitespace-pre-wrap text-red-300 leading-5 text-[11px] font-mono overflow-x-auto">
                                                    {executionResult.data.error || "An exception occurred during execution."}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Time Limit Exceeded Box */}
                                        {executionResult.data.status === "time_limit_exceeded" && (!executionResult.data.results || executionResult.data.results.length === 0) && (
                                            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                                    <AlertTriangle size={15} />
                                                    <span>Time Limit Exceeded</span>
                                                </div>
                                                <p className="text-slate-300 leading-5 text-xs font-mono">
                                                    Execution exceeded maximum allowed time limit per test case.
                                                </p>
                                            </div>
                                        )}

                                        {/* Memory Limit Exceeded Box */}
                                        {executionResult.data.status === "memory_limit_exceeded" && (
                                            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                                    <AlertTriangle size={15} />
                                                    <span>Memory Limit Exceeded</span>
                                                </div>
                                                <p className="text-slate-300 leading-5 text-xs font-mono">
                                                    Execution exceeded maximum allowed memory limit.
                                                </p>
                                            </div>
                                        )}

                                        {/* System Error Box */}
                                        {executionResult.data.status === "system_error" && (
                                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                                    <AlertTriangle size={15} />
                                                    <span>System Error</span>
                                                </div>
                                                <pre className="whitespace-pre-wrap text-red-300 leading-5 text-[11px] font-mono overflow-x-auto">
                                                    {executionResult.data.error || "An infrastructure error occurred."}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Per-test-case result cards */}
                                        {executionResult.data.results && executionResult.data.results.length > 0 && (
                                            <div className="space-y-3 font-mono">
                                                {executionResult.data.results.map((res) => (
                                                    <div
                                                        key={res.index}
                                                        className={`p-3.5 rounded-lg border space-y-2.5 ${
                                                            res.passed
                                                                ? "border-emerald-500/20 bg-emerald-500/5"
                                                                : "border-red-500/20 bg-red-500/5"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-slate-200">Sample Case {res.index}</span>
                                                            <span className={res.passed ? "text-emerald-400" : "text-red-400"}>
                                                                {res.passed
                                                                    ? "✓ Passed"
                                                                    : res.status
                                                                        ? `✗ ${res.status.replace("_", " ").toUpperCase()}`
                                                                        : "✗ Wrong Answer"
                                                                }
                                                            </span>
                                                        </div>

                                                        {res.input !== undefined && (
                                                            <div>
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Input:</span>
                                                                <pre className="mt-1 rounded bg-slate-900 border border-slate-800 p-2 text-slate-200 text-[11px] whitespace-pre-wrap">
                                                                    {formatPreText(res.input)}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {res.expectedOutput !== undefined && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Expected:</span>
                                                                    <pre className="mt-1 rounded bg-slate-900 border border-slate-800 p-2 text-emerald-400 text-[11px] whitespace-pre-wrap">
                                                                        {formatPreText(res.expectedOutput)}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Actual:</span>
                                                                    <pre className={`mt-1 rounded bg-slate-900 border border-slate-800 p-2 text-[11px] whitespace-pre-wrap ${res.passed ? "text-emerald-400" : "text-red-400"}`}>
                                                                        {formatPreText(res.actualOutput) || (res.error ? "(Error during execution)" : "(No output)")}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {res.error && (
                                                            <div>
                                                                <span className="text-[10px] uppercase font-semibold text-red-400 tracking-wider">Error details:</span>
                                                                <pre className="mt-1 rounded bg-red-950/40 border border-red-900/50 p-2 text-red-300 text-[11px] whitespace-pre-wrap overflow-x-auto">
                                                                    {res.error}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* MODE 2: Submit Code Output (Aggregate Stats — NEVER exposes hidden test inputs/outputs) */}
                                {executionResult.mode === "submit" && (
                                    <div className="space-y-4 font-sans">
                                        <div className={`rounded-xl border p-4 space-y-3 ${executionResult.data.status === "accepted"
                                            ? "border-emerald-500/30 bg-emerald-500/10"
                                            : "border-slate-800 bg-slate-900/60"
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-200">Test Case Results</span>
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${executionResult.data.status === "accepted"
                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                    }`}>
                                                    {executionResult.data.status.replace("_", " ")}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                                                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Visible Tests</p>
                                                    <p className="text-sm font-bold text-slate-200">
                                                        {executionResult.data.visiblePassed} / {executionResult.data.visibleTotal}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                                                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Hidden Tests</p>
                                                    <p className="text-sm font-bold text-slate-200">
                                                        {executionResult.data.hiddenPassed} / {executionResult.data.hiddenTotal}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                                                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1">Total Passed</p>
                                                    <p className={`text-sm font-bold ${executionResult.data.passed === executionResult.data.total
                                                        ? "text-emerald-400"
                                                        : "text-amber-400"
                                                        }`}>
                                                        {executionResult.data.passed} / {executionResult.data.total}
                                                    </p>
                                                </div>
                                            </div>

                                            {executionResult.data.status !== "accepted" && (
                                                <p className="text-xs text-amber-300/90 italic pt-1">
                                                    Some test cases failed. Adjust your solution and submit again.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ─── SCENARIO Renderer ─── */
    return (
        <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Your Answer
                    </p>
                    <p className="text-[11px] text-slate-500">
                        Write a concise response (3–4 sentences) covering your decision and rationale.
                    </p>
                </div>

                <button
                    type="button"
                    disabled
                    title="Voice input coming soon (Whisper)"
                    className="group flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 opacity-60 transition hover:border-violet-500/50 hover:text-violet-300 disabled:cursor-not-allowed"
                >
                    <Mic size={13} className="group-hover:animate-pulse" />
                    <span>Voice</span>
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                        Soon
                    </span>
                </button>
            </div>

            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write 3–4 sentences describing how you would approach this situation and why..."
                className="min-h-0 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-base text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                spellCheck={false}
            />

            {answer && (
                <p className="text-right text-xs text-slate-600">
                    {answer.length} character{answer.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
