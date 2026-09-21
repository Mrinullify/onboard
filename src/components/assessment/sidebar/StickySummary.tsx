import { Button } from "@/components/ui/button";
import { AssessmentSetup } from "../types/assessment";
import { validateAssessmentSetup } from "@/lib/assessment/validationFunction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { startAssessment } from "@/lib/assessment/api/assessment";

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
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                {/* HEADER */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Assessment Summary
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
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
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                        Topics
                    </h3>

                    {setup.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {setup.topics.map((topic) => (
                                <span
                                    key={topic}
                                    className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic">
                            Core &amp; standard topics (Cloud, Networks, DSA, CS Fundamentals, etc.)
                        </p>
                    )}
                </div>

                {/* FORMATS */}
                <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                        Formats
                    </h3>

                    {setup.formats.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {setup.formats.map((format) => (
                                <span
                                    key={format}
                                    className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">
                            No formats selected
                        </p>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-8 border-t pt-5">
                    <p className="text-xs text-gray-500">
                        Your assessment will be generated based on the selected
                        role, difficulty, experience, language, topics and formats.
                    </p>
                </div>
            </div>

            {isReady && (
                <div>
                    <Button
                        onClick={onClickStartAssessment}
                        className="mt-8
                                w-full
                                h-12
                                rounded-xl
                                bg-violet-600
                                text-white
                                font-semibold
                                transition-all
                                duration-200
                                hover:bg-violet-700
                                hover:shadow-lg
                                hover:-translate-y-0.5
                                active:translate-y-0
                                disabled:bg-gray-200
                                disabled:text-gray-500
                                disabled:shadow-none
                                disabled:hover:translate-y-0
                                disabled:hover:bg-gray-200
                                disabled:cursor-not-allowed"
                    >
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
        <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-right font-medium text-gray-900">
                {value || (
                    <span className="text-gray-400">
                        —
                    </span>
                )}
            </span>
        </div>
    );
}
