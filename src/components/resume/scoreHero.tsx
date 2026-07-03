import {
    Sparkles,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

export function OverallScoreHero() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/10 bg-linear-to-tr from-blue-700/20 via-green-800/20 to-yellow-500/20    p-10 shadow-xl">

            {/* Soft colorful glow (NOT black scary background) */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative z-10 text-center">

                {/* Badge */}
                <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-emerald-700 shadow-sm">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    AI Resume Verdict
                </div>

                {/* Score */}
                <h1 className="text-7xl font-extrabold tracking-tight text-zinc-900">
                    82<span className="text-3xl text-zinc-500">/100</span>
                </h1>

                {/* Verdict */}
                <p className="mt-3 text-2xl font-semibold text-zinc-800">
                    Above Average Resume
                </p>

                {/* Comparison */}
                <p className="mt-2 text-sm text-zinc-500">
                    Better than{" "}
                    <span className="font-semibold text-emerald-600">75%</span> of
                    candidates
                </p>

                {/* Metrics */}
                <div className="mt-8 flex justify-center gap-4 flex-wrap">

                    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-left shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-xs">ATS Pass Probability</p>
                        </div>
                        <p className="text-lg font-semibold text-zinc-900 mt-1">
                            92%
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-left shadow-sm">
                        <div className="flex items-center gap-2 text-blue-600">
                            <TrendingUp className="h-4 w-4" />
                            <p className="text-xs">Recruiter Attention</p>
                        </div>
                        <p className="text-lg font-semibold text-zinc-900 mt-1">
                            7.8 / 10
                        </p>
                    </div>

                </div>

                {/* Chips */}
                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-200">
                        ✓ ATS Optimized
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 border border-blue-200">
                        ✓ Strong Technical Skills
                    </span>

                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs text-yellow-700 border border-yellow-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Needs Quantified Impact
                    </span>
                </div>

                {/* Insight */}
                <div className="mt-8 mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
                    Your resume is technically strong and ATS-friendly, but lacks measurable
                    achievements. Adding quantified impact will significantly improve recruiter
                    interest for mid-level roles.
                </div>
            </div>
        </div>
    );
}