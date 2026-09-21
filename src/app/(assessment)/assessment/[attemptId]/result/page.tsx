import { getAssessmentResult, type ResultQuestion } from "@/lib/assessment/result";
import { auth } from "../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import {
    CheckCircle2,
    XCircle,
    MinusCircle,
    Trophy,
    Target,
    BookOpen,
    Clock,
} from "lucide-react";

interface Props {
    params: Promise<{ attemptId: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resultConfig(result: string | null) {
    switch (result) {
        case "EXCELLENT":
            return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", ring: "ring-emerald-500/40" };
        case "GOOD":
            return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", ring: "ring-blue-500/40" };
        case "AVERAGE":
            return { label: "Average", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", ring: "ring-amber-500/40" };
        case "NEEDS_IMPROVEMENT":
            return { label: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", ring: "ring-red-500/40" };
        default:
            return { label: "—", color: "text-slate-400", bg: "bg-slate-800 border-slate-700", ring: "ring-slate-600/40" };
    }
}

function difficultyConfig(difficulty: string) {
    switch (difficulty) {
        case "HARD": return "bg-red-500/15 text-red-400 border border-red-500/30";
        case "MEDIUM": return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
        default: return "bg-green-500/15 text-green-400 border border-green-500/30";
    }
}

// ─── Question Card (server component) ────────────────────────────────────────

function QuestionCard({ q, index }: { q: ResultQuestion; index: number }) {
    const isCorrect = q.score !== null && q.score > 0;
    const isWrong = q.score !== null && q.score === 0 && q.userAnswer;
    const unanswered = !q.userAnswer;
    const pending = q.score === null && q.userAnswer;

    return (
        <div className={`rounded-2xl border bg-slate-900/60 ${isCorrect ? "border-emerald-500/20" : isWrong ? "border-red-500/20" : "border-slate-800"}`}>
            {/* Card header */}
            <div className="flex items-start gap-4 p-5">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                    {isCorrect ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : isWrong ? (
                        <XCircle size={20} className="text-red-400" />
                    ) : pending ? (
                        <Clock size={20} className="text-amber-400" />
                    ) : (
                        <MinusCircle size={20} className="text-slate-500" />
                    )}
                </div>

                {/* Question text + badges */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Q{index + 1}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${difficultyConfig(q.difficulty)}`}>
                            {q.difficulty.toLowerCase()}
                        </span>
                        <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-300">
                            {q.questionType}
                        </span>
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] text-slate-400">
                            {q.topic}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-100">{q.questionText}</p>
                </div>

                {/* Score badge */}
                <div className="shrink-0 text-right">
                    {q.score !== null ? (
                        <div className={`text-lg font-bold tabular-nums ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                            {q.score}/{q.marks}
                        </div>
                    ) : (
                        <div className="text-sm text-amber-400 font-medium">
                            {unanswered ? "0/" + q.marks : "—/" + q.marks}
                        </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-0.5">
                        {q.score !== null ? "pts" : unanswered ? "unanswered" : "pending"}
                    </div>
                </div>
            </div>

            {/* MCQ options */}
            {q.questionType === "MCQ" && q.options && (
                <div className="px-5 pb-4 space-y-2">
                    {q.options.map((option) => {
                        const isTheCorrect = option === q.correctAnswer;
                        const isUserChoice = option === q.userAnswer;
                        let cls = "border-slate-700 bg-slate-800/40 text-slate-300";
                        if (isTheCorrect) cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
                        else if (isUserChoice && !isTheCorrect) cls = "border-red-500/50 bg-red-500/10 text-red-200";

                        return (
                            <div key={option} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${cls}`}>
                                {isTheCorrect ? (
                                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                ) : isUserChoice ? (
                                    <XCircle size={15} className="text-red-400 shrink-0" />
                                ) : (
                                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-600" />
                                )}
                                <span>{option}</span>
                                {isUserChoice && (
                                    <span className={`ml-auto text-[11px] font-semibold ${isTheCorrect ? "text-emerald-400" : "text-red-400"}`}>
                                        {isTheCorrect ? "Your answer ✓" : "Your answer ✗"}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {unanswered && (
                        <p className="text-xs text-slate-500 italic mt-1 pl-1">Not answered</p>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                        <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Explanation</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
                        </div>
                    )}
                </div>
            )}

            {/* SCENARIO / CODING */}
            {(q.questionType === "SCENARIO" || q.questionType === "CODING") && (
                <div className="px-5 pb-4 space-y-3">
                    {/* User's answer */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Your Answer</p>
                        {q.userAnswer ? (
                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{q.userAnswer}</p>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Not answered</p>
                        )}
                    </div>

                    {/* AI Feedback or Pending notice */}
                    {q.score !== null && q.feedback ? (
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">AI Evaluation Feedback</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{q.feedback}</p>
                        </div>
                    ) : q.score === null && q.userAnswer ? (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
                            <Clock size={14} className="text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-300">
                                This answer is pending AI evaluation. Score will be updated shortly.
                            </p>
                        </div>
                    ) : null}

                    {/* Evaluation criteria (SCENARIO) */}
                    {q.questionType === "SCENARIO" && q.evaluationCriteria && q.evaluationCriteria.length > 0 && (
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Evaluation Criteria</p>
                            <ul className="space-y-1">
                                {q.evaluationCriteria.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper to extract the typed question array (for TypeScript)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getQuestions(data: any) { return data.questions; }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AssessmentResultPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect("/sign-in");

    const { attemptId } = await params;

    const res = await getAssessmentResult(attemptId);

    if (!res.success) {
        if (res.error === "Unauthorized") redirect("/sign-in");
        notFound();
    }

    const { data } = res;
    const cfg = resultConfig(data.result);

    const mcqQuestions = data.questions.filter((q) => q.questionType === "MCQ");
    const mcqScored = mcqQuestions.filter((q) => q.score !== null).length;
    const scoredCorrect = mcqQuestions.filter((q) => (q.score ?? 0) > 0).length;

    return (
        <div className="min-h-screen bg-slate-950 text-white">

            {/* ── Header ── */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Assessment Result</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{data.totalQuestions} questions · Attempt ID: {attemptId.slice(-8)}</p>
                    </div>
                    <a
                        href="/dashboard"
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-white"
                    >
                        ← Dashboard
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">

                {/* ── Score Card ── */}
                <div className={`rounded-2xl border ${cfg.bg} p-8`}>
                    <div className="flex flex-col sm:flex-row items-center gap-8">

                        {/* Ring score */}
                        <div className={`relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-4 ${cfg.ring} ring-4 bg-slate-950`}>
                            <div className="text-center">
                                <p className={`text-3xl font-black tabular-nums ${cfg.color}`}>
                                    {data.percentage !== null ? `${data.percentage}%` : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Score</p>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                            <StatBox label="Result" value={cfg.label} color={cfg.color} />
                            <StatBox
                                label="Marks"
                                value={`${data.obtainedMarks ?? "—"} / ${data.totalMarks}`}
                                color="text-white"
                            />
                            <StatBox label="Questions" value={`${data.totalQuestions}`} color="text-white" />
                            <StatBox
                                label="MCQ Correct"
                                value={`${scoredCorrect} / ${mcqQuestions.length}`}
                                color={scoredCorrect === mcqQuestions.length ? "text-emerald-400" : "text-white"}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Summary Bar ── */}
                <div className="flex flex-wrap gap-3">
                    <SummaryChip icon={<Trophy size={13} />} label="Result" value={cfg.label} color={cfg.color} />
                    <SummaryChip icon={<Target size={13} />} label="MCQ Scored" value={`${mcqScored}/${mcqQuestions.length}`} color="text-slate-300" />
                    <SummaryChip icon={<BookOpen size={13} />} label="Total Questions" value={String(data.totalQuestions)} color="text-slate-300" />
                    {data.endedAt && (
                        <SummaryChip
                            icon={<Clock size={13} />}
                            label="Submitted"
                            value={new Date(data.endedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            color="text-slate-300"
                        />
                    )}
                </div>

                {/* ── Question Breakdown ── */}
                <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                        Question Breakdown
                    </h2>
                    <div className="space-y-4">
                        {data.questions.map((q, i) => (
                            <QuestionCard key={q.id} q={q} index={i} />
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}

// ─── Tiny helper components ───────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
    );
}

function SummaryChip({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/60 px-3.5 py-2 text-sm">
            <span className="text-slate-500">{icon}</span>
            <span className="text-slate-400 text-xs">{label}:</span>
            <span className={`font-semibold text-xs ${color}`}>{value}</span>
        </div>
    );
}
