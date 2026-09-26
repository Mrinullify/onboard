import { toggleObjectState } from "@/lib/state-utils";
import { Difficulty } from "../types/assessment";
import { Props } from "./AssessmentTypeSection";

const difficulties: {
    label: string,
    value: Difficulty,
    desc: string;
}[] = [
        {
            label: "Easy",
            value: "easy",
            desc: "Basic questions, perfect for beginners",
        },
        {
            label: "Medium",
            value: "medium",
            desc: "Balanced mix of conceptual + practical",
        },
        {
            label: "Hard",
            value: "hard",
            desc: "Advanced level, assessment-grade questions",
        },
    ];

export default function DifficultySection({ setup, setSetup }: Props) {
    const handleSelect = (id: Difficulty) => {
        toggleObjectState(setSetup, 'difficulty', id, '');
    }
    return (
        <div className="w-full mt-6 p-6 bg-card rounded-xl border border-border/80">
            <h2 className="text-lg font-semibold text-foreground mb-1">
                Select Difficulty
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Choose how challenging your assessment should be
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {difficulties.map((diff) => {
                    const isSelected = setup.difficulty === diff.value;

                    return (
                        <div
                            key={diff.value}
                            onClick={() => handleSelect(diff.value)}
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
                                {diff.label}
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1">
                                {diff.desc}
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
