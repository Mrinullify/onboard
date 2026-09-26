import { toggleObjectState } from "@/lib/state-utils";
import { Props } from "./AssessmentTypeSection";

const experienceLevels = [
    {
        label: "Fresher",
        value: "fresher",
        desc: "0 years of professional experience",
    },
    {
        label: "1–2 Years",
        value: "junior",
        desc: "Early professional experience",
    },
    {
        label: "3–5 Years",
        value: "mid",
        desc: "Intermediate level engineer",
    },
    {
        label: "5+ Years",
        value: "senior",
        desc: "Senior / Lead level assessments",
    },
];

export default function ExperienceSection({ setup, setSetup }: Props) {
    const handleSelect = (id: string) => {
        toggleObjectState(setSetup, 'experience', id, '');
    }
    return (
        <div className="w-full mt-6 p-6 bg-card rounded-xl border border-border/80">
            <h2 className="text-lg font-semibold text-foreground mb-1">
                Experience Level
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
                Helps tailor assessment depth and question complexity
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experienceLevels.map((exp) => {
                    const isSelected = setup.experience === exp.value;

                    return (
                        <div
                            key={exp.value}
                            onClick={() => handleSelect(exp.value)}
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
                                {exp.label}
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1">
                                {exp.desc}
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
