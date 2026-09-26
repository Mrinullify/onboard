import { Button } from "@/components/ui/button";
import { AssessmentSetup } from "../types/assessment";
import { validateAssessmentSetup } from "@/lib/assessment/validationFunction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { startAssessment } from "@/lib/assessment/api/assessment";
import { CheckCircle2 } from "lucide-react";

type AssessmentSummaryProps = {
    setup: AssessmentSetup;
    loading: boolean;
    setLoading: (loading: boolean) => void;
};

export default function StickySummary({
    setup,
    loading,
    setLoading,
}: AssessmentSummaryProps) {

    const router = useRouter();

    const hasCodingFormat = setup.formats.some(
        (f) => f.toUpperCase() === "CODING" || f === "Coding"
    );

    const isReady =
        Boolean(setup.assessmentType) &&
        Boolean(setup.role) &&
        Boolean(setup.difficulty) &&
        Boolean(setup.experience) &&
        Boolean(setup.duration) &&
        setup.formats.length > 0 &&
        (!hasCodingFormat || Boolean(setup.language));

    const onClickStartAssessment = async () => {
        if (hasCodingFormat && !setup.language) {
            toast.error("Please select a programming language for coding questions.");
            return;
        }

        setLoading(true);

        try {
            const validation = validateAssessmentSetup(setup);

            if (!validation.isValid) {
                toast.error(
                    `The selected question formats require at least ${validation.requiredMinutes} minutes.`
                );

                return;
            }

            const data = await startAssessment(setup);

            router.push(`/assessment/${data.attemptId}`);
            toast.success(data.message);

        } catch (err) {
            console.error(err);
            toast.error("Failed to start assessment");
        } finally {
            setLoading(false);
        }
    }

    return (
        <aside className="sticky top-20 w-full max-w-sm">
            <div className="rounded-2xl border border-border/80 bg-card p-6">
                {/* HEADER */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                        Assessment Summary
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Review your assessment before starting.
                    </p>
                </div>

                {/* DETAILS */}
                <div className="space-y-4">

                    <SummaryItem
                        label="Assessment Type"
                        value={setup.assessmentType}
                    />

                    <SummaryItem
                        label="Role"
                        value={setup.role}
                    />

                    <SummaryItem
                        label="Difficulty"
                        value={setup.difficulty}
                    />

                    <SummaryItem
                        label="Experience"
                        value={setup.experience}
                    />

                    <SummaryItem
                        label="Language"
                        value={setup.language || (hasCodingFormat ? "Required for coding" : "Language Agnostic")}
                    />

                    <SummaryItem
                        label="Duration"
                        value={
                            setup.duration
                                ? `${setup.duration} Minutes`
                                : ""
                        }
                    />

                </div>

                {/* TOPICS */}
                <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                        Topics
                    </h3>

                    {setup.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {setup.topics.map((topic) => (
                                <span
                                    key={topic}
                                    className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm text-primary"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            Core &amp; standard topics (Cloud, Networks, DSA, CS Fundamentals, etc.)
                        </p>
                    )}
                </div>

                {/* FORMATS */}
                <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                        Formats
                    </h3>

                    {setup.formats.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {setup.formats.map((format) => (
                                <span
                                    key={format}
                                    className="rounded-full bg-accent border border-accent-foreground/10 px-3 py-1 text-sm text-accent-foreground"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No formats selected
                        </p>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-6 border-t border-border/80 pt-5">
                    <p className="text-xs text-muted-foreground">
                        Your assessment will be generated based on the selected
                        role, difficulty, experience, language, topics and formats.
                    </p>
                </div>
            </div>

            {isReady && (
                <div>
                    <Button
                        onClick={onClickStartAssessment}
                        disabled={loading}
                        className="mt-4
                                w-full
                                h-12
                                rounded-xl
                                bg-primary
                                text-primary-foreground
                                font-semibold
                                transition-all
                                duration-200
                                hover:bg-primary/90
                                hover:shadow-lg
                                hover:-translate-y-0.5
                                active:translate-y-0
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Start Assessment
                    </Button>
                </div>
            )}
        </aside>
    );
}


// Helper Func

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0">
            <span className="text-sm text-muted-foreground">
                {label}
            </span>

            <span className="text-right font-medium text-foreground">
                {value || (
                    <span className="text-muted-foreground/50">
                        —
                    </span>
                )}
            </span>
        </div>
    );
}
