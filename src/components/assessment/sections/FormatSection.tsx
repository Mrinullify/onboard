import { toast } from "sonner";
import { AssessmentSetup } from "../types/assessment";

type FormatOption = {
    label: string;
    value: string;
    desc: string;
};

const formats: FormatOption[] = [
    {
        label: "MCQ",
        value: "MCQ",
        desc: "Multiple choice questions with one correct answer",
    },
    {
        label: "Coding",
        value: "Coding",
        desc: "Hands-on implementation and problem solving in Monaco editor",
    },
    {
        label: "Scenario Based",
        value: "Scenario Based",
        desc: "Real-world situations requiring 3–4 sentence candidate response evaluated by AI rubric",
    },
];

type Props = {
    setup: AssessmentSetup;
    setSetup: React.Dispatch<React.SetStateAction<AssessmentSetup>>;
};

export default function FormatSection({ setup, setSetup }: Props) {
    const toggleFormat = (format: string) => {
        const isSelecting = !setup.formats.includes(format);

        if (isSelecting && format === "Coding" && !setup.language) {
            toast.warning("Please select a programming language for coding questions.");
        }

        setSetup((prev) => ({
            ...prev,
            formats: prev.formats.includes(format)
                ? prev.formats.filter((item) => item !== format)
                : [...prev.formats, format],
        }));
    };

    return (
        <div className="w-full mt-6 p-6 bg-card rounded-xl border border-border/80">
            <h2 className="text-lg font-semibold text-foreground mb-1">
                Select Formats
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Choose one or more question formats for this assessment
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formats.map((format) => {
                    const isSelected = setup.formats.includes(format.value);

                    return (
                        <div
                            key={format.value}
                            onClick={() => toggleFormat(format.value)}
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
                                {format.label}
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1">
                                {format.desc}
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
