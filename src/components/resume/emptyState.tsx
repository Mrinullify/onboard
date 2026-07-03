import Image from "next/image";

export function ResumeEmptyState() {
    return (
        <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-col items-center text-center">
                <Image
                    src="/Images/resume-searching.svg"
                    alt="Resume Analysis"
                    width={240}
                    height={240}
                    className="mb-6"
                />

                <h2 className="text-xl font-semibold">
                    No Resume Analyzed Yet
                </h2>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Upload your resume to receive ATS analysis, AI feedback,
                    keyword recommendations, and personalized improvement suggestions.
                </p>

                <div className="mt-6 rounded-lg border bg-muted/40 px-4 py-3">
                    <p className="text-sm italic text-muted-foreground">
                        💡 Tip: Quantify your achievements whenever possible.
                        Recruiters love measurable impact.
                    </p>
                </div>
            </div>
        </div>
    );
}