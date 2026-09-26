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
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-secondary/30 p-6 sm:p-10 shadow-xs">
            <div className="relative z-10 text-center">
                {/* Badge */}
                <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>AI Resume Analysis</span>
                </div>

                {/* Score */}
                <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
                    {Math.round(score)}<span className="text-2xl sm:text-3xl text-muted-foreground font-normal">/100</span>
                </h2>

                {/* Verdict */}
                <p className="mt-2 text-xl font-semibold text-foreground">
                    {verdict}
                </p>

                {/* Comparison */}
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Estimated benchmark: better than{" "}
                    <span className="font-semibold text-foreground">{percentile}%</span> of analyzed profiles
                </p>

                {/* Metrics */}
                <div className="mt-6 flex justify-center gap-3 sm:gap-4 flex-wrap">
                    <div className="rounded-xl border border-border/80 bg-card px-4 py-3 text-left shadow-2xs min-w-[150px]">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-xs font-medium text-muted-foreground">ATS Match</p>
                        </div>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                            {Math.round(atsScore)}%
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card px-4 py-3 text-left shadow-2xs min-w-[150px]">
                        <div className="flex items-center gap-2 text-primary">
                            <TrendingUp className="h-4 w-4" />
                            <p className="text-xs font-medium text-muted-foreground">Impact Rating</p>
                        </div>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                            {(score / 10).toFixed(1)} / 10
                        </p>
                    </div>
                </div>

                {/* Chips */}
                <div className="mt-5 flex justify-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ {strengthsCount} Key Strengths Identified
                    </span>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                        ✓ ATS Structured
                    </span>

                    {weaknessesCount > 0 && (
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {weaknessesCount} Actionable Improvements
                        </span>
                    )}
                </div>

                {/* Insight */}
                {feedback && (
                    <div className="mt-6 mx-auto max-w-2xl rounded-xl border border-border/80 bg-background/80 p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground shadow-2xs text-left leading-relaxed">
                        {feedback}
                    </div>
                )}
            </div>
        </div>
    );
}