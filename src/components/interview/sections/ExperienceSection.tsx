import { toggleObjectState } from "@/lib/state-utils";
import { Props } from "./InterviewTypeSection";
import { Difficulty } from "../types/interview";

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
        desc: "Senior / Lead level interviews",
    },
];

export default function ExperienceSection({ setup, setSetup }: Props) {
    const handleSelect = (id: string) => {
        toggleObjectState(setSetup, 'experience', id, '');
    }
    return (
        <div className="w-full mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Experience Level
            </h2>

            <p className="text-sm text-gray-500 mb-4">
                Helps tailor interview depth and question complexity
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experienceLevels.map((exp) => {
                    const isSelected = setup.experience === exp.value;

                    return (
                        <div
                            key={exp.value}
                            onClick={() => handleSelect(exp.value)
                            }
                            className={`
                                cursor-pointer rounded-xl border p-4 transition-all duration-200
                                hover:shadow-md hover:scale-[1.02]
                                ${isSelected
                                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                    : "border-gray-200 bg-white"
                                }
                            `}
                        >
                            <h3
                                className={`font-semibold ${isSelected
                                    ? "text-emerald-600"
                                    : "text-gray-800"
                                    }`}
                            >
                                {exp.label}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {exp.desc}
                            </p>

                            {isSelected && (
                                <div className="mt-3 text-xs font-medium text-emerald-600">
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