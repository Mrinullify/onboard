import {
    Sparkles,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

interface OverallScoreHeroProps {
    score?: number;
    atsScore?: number;
    strengthsCount?: number;
    weaknessesCount?: number;
    feedback?: string;
}

export function OverallScoreHero({
    score = 82,
    atsScore = 88,
    strengthsCount = 3,
    weaknessesCount = 2,
    feedback,
}: OverallScoreHeroProps) {
    const verdict =
        score >= 85
            ? "Exceptional Resume"
            : score >= 70
            ? "Above Average Resume"
            : score >= 50
            ? "Needs Moderate Improvements"
            : "Needs Significant Rework";

    const percentile = Math.min(99, Math.max(15, Math.round(score * 0.95)));

    return (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/10 bg-linear-to-tr from-blue-700/20 via-green-800/20 to-yellow-500/20 p-10 shadow-xl">
            {/* Soft colorful glow */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative z-10 text-center">
                {/* Badge */}
                <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 shadow-sm">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    AI Resume Verdict
                </div>

                {/* Score */}
                <h1 className="text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {Math.round(score)}<span className="text-3xl text-zinc-500">/100</span>
                </h1>

                {/* Verdict */}
                <p className="mt-3 text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
                    {verdict}
                </p>

                {/* Comparison */}
                <p className="mt-2 text-sm text-zinc-500">
                    Better than{" "}
                    <span className="font-semibold text-emerald-600">{percentile}%</span> of candidates
                </p>

                {/* Metrics */}
                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                    <div className="rounded-2xl border border-zinc-200 bg-white/90 dark:bg-zinc-900/90 px-5 py-3 text-left shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-xs">ATS Pass Probability</p>
                        </div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                            {Math.round(atsScore)}%
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white/90 dark:bg-zinc-900/90 px-5 py-3 text-left shadow-sm">
                        <div className="flex items-center gap-2 text-blue-600">
                            <TrendingUp className="h-4 w-4" />
                            <p className="text-xs">Recruiter Attention</p>
                        </div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                            {(score / 10).toFixed(1)} / 10
                        </p>
                    </div>
                </div>

                {/* Chips */}
                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-200">
                        ✓ {strengthsCount} Key Strengths Identified
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 border border-blue-200">
                        ✓ ATS Structured
                    </span>

                    {weaknessesCount > 0 && (
                        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs text-yellow-700 border border-yellow-200 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {weaknessesCount} Actionable Improvements
                        </span>
                    )}
                </div>

                {/* Insight */}
                {feedback && (
                    <div className="mt-8 mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white/90 dark:bg-zinc-900/90 p-5 text-sm text-zinc-600 dark:text-zinc-300 shadow-sm text-left">
                        {feedback}
                    </div>
                )}
            </div>
        </div>
    );
}