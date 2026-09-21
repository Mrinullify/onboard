import { toggleObjectState } from "@/lib/state-utils";
import { Language } from "../types/assessment";
import { Props } from "./AssessmentTypeSection";

const languages: {
    label: string;
    value: Language;
    desc: string;
    icon: string;
}[] = [
    {
        label: "C",
        value: "C",
        desc: "Low-level, close to hardware",
        icon: "🔧",
    },
    {
        label: "C++",
        value: "C++",
        desc: "Systems & performance-critical code",
        icon: "⚙️",
    },
    {
        label: "Java",
        value: "Java",
        desc: "Enterprise & Android development",
        icon: "☕",
    },
    {
        label: "Python",
        value: "Python",
        desc: "Data science, scripting & backend",
        icon: "🐍",
    },
];

export default function LanguageSection({ setup, setSetup }: Props) {
    const handleSelect = (lang: Language) => {
        toggleObjectState(setSetup, "language", lang, "");
    };

    return (
        <div className="w-full mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Preferred Language
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                Choose the programming language you are comfortable with
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {languages.map((lang) => {
                    const isSelected = setup.language === lang.value;

                    return (
                        <div
                            key={lang.value}
                            onClick={() => handleSelect(lang.value)}
                            className={`
                                cursor-pointer rounded-xl border p-4 transition-all duration-200
                                hover:shadow-md hover:scale-[1.02]
                                ${isSelected
                                    ? "border-violet-500 bg-violet-50 shadow-sm"
                                    : "border-gray-200 bg-white"
                                }
                            `}
                        >
                            <div className="text-2xl mb-2">{lang.icon}</div>

                            <h3
                                className={`font-semibold ${isSelected
                                    ? "text-violet-600"
                                    : "text-gray-800"
                                    }`}
                            >
                                {lang.label}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {lang.desc}
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
