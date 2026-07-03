import { toggleObjectState } from "@/lib/state-utils";
import { Difficulty } from "../types/interview";
import { Props } from "./InterviewTypeSection";


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
            desc: "Advanced level, interview-grade questions",
        },
    ];

export default function DifficultySection({ setup, setSetup }: Props) {
    const handleSelect = (id: Difficulty) => {
        toggleObjectState(setSetup, 'difficulty', id, '');
    }
    return (
        <div className="w-full mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Select Difficulty
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                Choose how challenging your interview should be
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
                                hover:shadow-md hover:scale-[1.02]
                                ${isSelected
                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                    : "border-gray-200 bg-white"
                                }
                            `}
                        >
                            <h3
                                className={`font-semibold ${isSelected
                                    ? "text-blue-600"
                                    : "text-gray-800"
                                    }`}
                            >
                                {diff.label}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {diff.desc}
                            </p>

                            {isSelected && (
                                <div className="mt-3 text-xs font-medium text-blue-600">
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