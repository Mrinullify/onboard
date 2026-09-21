import { EnrichedMCQ } from "@/schemas/question";

interface Props {
    question: EnrichedMCQ;
    answer: string;
    setAnswer: (value: string) => void;
}

export default function MCQFormat({ question, answer, setAnswer }: Props) {
    return (
        <>
            <div>
                <h3 className="mb-8 text-xl font-medium leading-8">
                    {question.questionText}
                </h3>

                <div className="space-y-4">
                    {question.metadata.options.map((option, index) => {
                        const isSelected = answer === option;
                        return (
                            <button
                                key={index}
                                onClick={() => setAnswer(option)}
                                className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition ${
                                    isSelected
                                        ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                                        : "border-slate-700 bg-slate-950 hover:border-blue-500/50 hover:bg-slate-900/50"
                                }`}
                            >
                                <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-sm transition ${
                                    isSelected
                                        ? "border-blue-500 bg-blue-500 text-white"
                                        : "border-slate-500 text-slate-400"
                                }`}>
                                    {String.fromCharCode(65 + index)}
                                </div>

                                <span className={isSelected ? "text-white font-medium" : "text-slate-300"}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
