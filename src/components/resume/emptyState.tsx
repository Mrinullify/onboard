import Image from "next/image";

export function ResumeEmptyState() {
    return (
        <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col items-center text-center">
                <Image
                    src="/Images/resume-searching.svg"
                    alt="Resume Analysis"
                    width={220}
                    height={220}
                    className="mb-5 opacity-95"
                />

                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    No Resume Analyzed Yet
                </h2>

                <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Upload your resume to receive ATS scoring, keyword matching, structure analysis, and personalized recommendations.
                </p>

                <div className="mt-5 rounded-lg border border-border/80 bg-secondary/30 px-4 py-2.5">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Pro-tip:</span> Quantify your achievements with measurable percentages, latency drops, or revenue impact.
                    </p>
                </div>
            </div>
        </div>
    );
}