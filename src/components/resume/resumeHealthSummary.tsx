import { Sparkles, TrendingUp, Briefcase, Target } from "lucide-react";

interface ResumeHealthSummaryProps {
    score?: number;
    targetRole?: string;
    feedback?: string;
    topRecommendation?: string;
    topOpportunity?: string;
}

export function ResumeHealthSummary({
    score = 75,
    targetRole,
    feedback,
    topRecommendation,
    topOpportunity,
}: ResumeHealthSummaryProps) {
    const verdict =
        score >= 85
            ? "Strong Market Ready"
            : score >= 70
            ? "Solid Technical Foundation"
            : score >= 50
            ? "Developing Profile"
            : "Needs Comprehensive Review";

    const headline =
        score >= 85
            ? "High-Impact Competitive Resume"
            : score >= 70
            ? "Above Average Technical Resume"
            : "Requires Key Skill Enhancements";

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
            <div className="relative z-10">
                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Resume Health Summary
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            AI-generated executive review & role alignment
                        </p>
                    </div>
                </div>

                {/* Verdict & Headline */}
                <div className="mb-6">
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {verdict}
                    </span>

                    <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {headline}
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
                        {feedback ||
                            "Your resume demonstrates good technical competency and relevant experience. Aligning your quantified outcomes with target role expectations will maximize interview callbacks."}
                    </p>
                </div>

                {/* Insight Chips */}
                <div className="mb-6 flex flex-wrap gap-3">
                    <div className="rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">Recruiter Impression</p>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                            {score >= 80 ? "Top 15% Candidate" : score >= 65 ? "Above Average" : "Average"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">Target Alignment</p>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                            {targetRole || "Software Engineering"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">Interview Readiness</p>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                            {score >= 80 ? "Interview Ready" : "Minor Tuning Recommended"}
                        </p>
                    </div>
                </div>

                {/* Opportunity Section */}
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border/80 bg-background/60 p-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-4 w-4" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Biggest Opportunity</h4>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {topOpportunity ||
                                "Add metrics, measurable percentages, and latency/revenue impact to your bullet points."}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-background/60 p-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-primary">
                            <Briefcase className="h-4 w-4" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Target Position</h4>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {targetRole
                                ? `${targetRole}, related cloud and backend roles.`
                                : "Full Stack Developer, Software Engineer, Frontend Engineer."}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-background/60 p-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-primary">
                            <Target className="h-4 w-4" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Next Priority</h4>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {topRecommendation ||
                                "Refine summary to highlight core technical strengths and target role keywords."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}