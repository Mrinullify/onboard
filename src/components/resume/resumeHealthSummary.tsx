import { Sparkles, TrendingUp, Briefcase, Target } from "lucide-react";

export function ResumeHealthSummary() {
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
                        Strong Foundation
                    </span>

                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
                        Above Average Resume
                    </h1>

                    <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-300">
                        Your resume demonstrates strong technical competency,
                        relevant project experience, and good ATS compatibility.
                        The biggest opportunity lies in quantifying project
                        outcomes and emphasizing measurable business impact.
                    </p>
                </div>

                {/* Insight Chips */}
                <div className="mb-8 flex flex-wrap gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">
                            Recruiter Impression
                        </p>

                        <p className="mt-1 font-semibold text-white">
                            Above Average
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">
                            Resume Personality
                        </p>

                        <p className="mt-1 font-semibold text-white">
                            Builder-Focused
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">
                            Interview Readiness
                        </p>

                        <p className="mt-1 font-semibold text-white">
                            Junior Developer Ready
                        </p>
                    </div>
                </div>

                {/* Opportunity Section */}
                <div className="grid gap-4 md:grid-cols-3">

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                        <TrendingUp className="mb-3 h-5 w-5 text-emerald-400" />

                        <h3 className="font-semibold text-white">
                            Biggest Opportunity
                        </h3>

                        <p className="mt-2 text-sm text-zinc-400">
                            Add metrics and measurable achievements to improve
                            recruiter confidence and impact.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                        <Briefcase className="mb-3 h-5 w-5 text-sky-400" />

                        <h3 className="font-semibold text-white">
                            Best Matched Roles
                        </h3>

                        <p className="mt-2 text-sm text-zinc-400">
                            Full Stack Developer, Frontend Engineer,
                            Software Engineering Intern.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                        <Target className="mb-3 h-5 w-5 text-violet-400" />

                        <h3 className="font-semibold text-white">
                            Next Priority
                        </h3>

                        <p className="mt-2 text-sm text-zinc-400">
                            Rewrite project bullet points using action verbs
                            and quantified outcomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}