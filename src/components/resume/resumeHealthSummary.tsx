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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-blue-900 via-green-950 to-pink-800 p-8 shadow-2xl">
            {/* Glow Effects */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/15 p-2">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Resume Health Summary
                        </h2>

                        <p className="text-sm text-zinc-400">
                            AI generated executive overview
                        </p>
                    </div>
                </div>

                {/* Verdict */}
                <div className="mb-6">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        {verdict}
                    </span>

                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
                        {headline}
                    </h1>

                    <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-300">
                        {feedback ||
                            "Your resume demonstrates good technical competency and relevant experience. Aligning your quantified outcomes with target role expectations will maximize interview callbacks."}
                    </p>
                </div>

                {/* Insight Chips */}
                <div className="mb-8 flex flex-wrap gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Recruiter Impression</p>
                        <p className="mt-1 font-semibold text-white">
                            {score >= 80 ? "Top 15% Candidate" : score >= 65 ? "Above Average" : "Average"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Target Alignment</p>
                        <p className="mt-1 font-semibold text-white">
                            {targetRole || "Software Engineering"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Interview Readiness</p>
                        <p className="mt-1 font-semibold text-white">
                            {score >= 80 ? "Interview Ready" : "Minor Tuning Recommended"}
                        </p>
                    </div>
                </div>

                {/* Opportunity Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <TrendingUp className="mb-3 h-5 w-5 text-emerald-400" />
                        <h3 className="font-semibold text-white">Biggest Opportunity</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                            {topOpportunity ||
                                "Add metrics, measurable percentages, and latency/revenue impact to your bullet points."}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <Briefcase className="mb-3 h-5 w-5 text-sky-400" />
                        <h3 className="font-semibold text-white">Target Position</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                            {targetRole
                                ? `${targetRole}, related cloud and backend roles.`
                                : "Full Stack Developer, Software Engineer, Frontend Engineer."}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <Target className="mb-3 h-5 w-5 text-violet-400" />
                        <h3 className="font-semibold text-white">Next Priority</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                            {topRecommendation ||
                                "Refine summary to highlight core technical strengths and target role keywords."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}