import { Button } from "@/components/ui/button";
import { InterviewSetup } from "../types/interview";

type InterviewSummaryProps = {
    setup: InterviewSetup;
};

export default function StickySummary({
    setup,
}: InterviewSummaryProps) {


    const isReady =
        setup.interviewType &&
        setup.role &&
        setup.difficulty &&
        setup.experience &&
        setup.topics.length > 0 &&
        setup.duration;


    return (
        <aside className="sticky top-20 w-full max-w-sm">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                {/* HEADER */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Interview Summary
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Review your interview before starting.
                    </p>
                </div>

                {/* DETAILS */}
                <div className="space-y-4">

                    <SummaryItem
                        label="Interview Type"
                        value={setup.interviewType}
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
                        <p className="text-sm text-gray-400">
                            No topics selected
                        </p>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-8 border-t pt-5">
                    <p className="text-xs text-gray-500">
                        Your interview will be generated based on the selected
                        role, difficulty, experience and topics.
                    </p>
                </div>
            </div>

            <div>
                <Button
                    disabled={!isReady}
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
                    Start Interview
                </Button>
            </div>
        </aside>
    );
}

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