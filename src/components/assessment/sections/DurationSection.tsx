import { AssessmentSetup } from "../types/assessment";

export type DurationType = 15 | 30 | 60 | 120;

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
            desc: "Standard assessment",
        },
        {
            label: "60 Minutes",
            value: 60,
            desc: "In-depth assessment",
        },
        {
            label: "120 Minutes",
            value: 120,
            desc: "Long-form Assessment",
        }
    ];

type DurationSelectorProps = {
    setup: AssessmentSetup;
    setSetup: React.Dispatch<React.SetStateAction<AssessmentSetup>>;
};

import { toggleObjectState } from "@/lib/state-utils";

export default function DurationSection({
    setup,
    setSetup,
}: DurationSelectorProps) {
    return (
        <div className="w-full mt-6 p-6 bg-card rounded-xl border border-border/80">
            <h2 className="text-lg font-semibold text-foreground mb-1">
                Assessment Duration
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
                Choose how long you&apos;d like your assessment to last
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {durations.map((duration) => {
                    const isSelected = setup.duration === duration.value;

                    return (
                        <div
                            key={duration.value}
                            onClick={() => toggleObjectState(setSetup, "duration", duration.value)}
                            className={`
                                cursor-pointer rounded-xl border p-4 transition-all duration-200
                                hover:shadow-sm hover:scale-[1.02]
                                ${isSelected
                                    ? "border-primary bg-primary/8 shadow-sm"
                                    : "border-border/80 bg-background hover:border-border"
                                }
                            `}
                        >
                            <h3
                                className={`font-semibold ${isSelected
                                    ? "text-primary"
                                    : "text-foreground"
                                    }`}
                            >
                                {duration.label}
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1">
                                {duration.desc}
                            </p>

                            {isSelected && (
                                <div className="mt-3 text-xs font-medium text-primary">
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
