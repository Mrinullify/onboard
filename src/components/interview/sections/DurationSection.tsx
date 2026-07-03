import { InterviewSetup } from "../types/interview";

export type DurationType = 15 | 30 | 45 | 60;

const durations: {
    label: string;
    value: DurationType;
    desc: string;
}[] = [
        {
            label: "15 Minutes",
            value: 15,
            desc: "Quick practice session",
        },
        {
            label: "30 Minutes",
            value: 30,
            desc: "Standard interview",
        },
        {
            label: "45 Minutes",
            value: 45,
            desc: "In-depth interview",
        },
        {
            label: "60 Minutes",
            value: 60,
            desc: "Full mock interview",
        },
    ];

type DurationSelectorProps = {
    setup: InterviewSetup;
    setSetup: React.Dispatch<React.SetStateAction<InterviewSetup>>;
};

import { toggleObjectState } from "@/lib/state-utils";

export default function DurationSection({
    setup,
    setSetup,
}: DurationSelectorProps) {
    return (
        <div className="w-full mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Interview Duration
            </h2>

            <p className="text-sm text-gray-500 mb-4">
                Choose how long you&apos;d like your interview to last
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {durations.map((duration) => {
                    const isSelected = setup.duration === duration.value;

                    return (
                        <div
                            key={duration.value}
                            onClick={() => toggleObjectState(setSetup, "duration", duration.value, "")}
                            className={`
                                cursor-pointer rounded-xl border p-4 transition-all duration-200
                                hover:shadow-md hover:scale-[1.02]
                                ${isSelected
                                    ? "border-violet-500 bg-violet-50 shadow-sm"
                                    : "border-gray-200 bg-white"
                                }
                            `}
                        >
                            <h3
                                className={`font-semibold ${isSelected
                                    ? "text-violet-600"
                                    : "text-gray-800"
                                    }`}
                            >
                                {duration.label}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {duration.desc}
                            </p>

                            {isSelected && (
                                <div className="mt-3 text-xs font-medium text-violet-600">
                                    Selected ✓
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}