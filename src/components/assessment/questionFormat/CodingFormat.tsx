import { EnrichedClientCoding } from "@/schemas/question";

interface Props {
    question: EnrichedClientCoding;
}

function formatPreText(text?: string): string {
    if (!text) return "";
    return text
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\/r\/n/g, "\n")
        .replace(/\/n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
}

export default function CodingFormat({ question }: Props) {
    const { metadata } = question;

    return (
        <div className="space-y-8">
            {/* Problem Statement */}
            <div>
                <h3 className="mb-4 text-xl font-medium leading-8">
                    Coding Challenge
                </h3>

                <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
                    <p className="whitespace-pre-line leading-8 text-slate-200">
                        {question.questionText}
                    </p>
                </div>
            </div>

            {/* Constraints */}
            {metadata.constraints && metadata.constraints.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
                    <h4 className="mb-4 text-lg font-semibold">
                        Constraints
                    </h4>

                    <ul className="list-disc space-y-2 pl-5 text-slate-300">
                        {metadata.constraints.map((constraint, index) => (
                            <li key={index}>{constraint}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Sample Test Cases (Visible Test Cases) */}
            {metadata.visibleTestCases && metadata.visibleTestCases.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold">
                        Sample Test Cases
                    </h4>

                    {metadata.visibleTestCases.map((tc, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-slate-700 bg-slate-950 p-6"
                        >
                            <p className="mb-3 font-medium text-slate-300 text-sm">
                                Sample Case {index + 1}
                            </p>

                            <div className="space-y-3 font-mono text-sm">
                                <div>
                                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Input:</span>
                                    <pre className="mt-1 rounded-lg bg-slate-900 border border-slate-800 p-3 text-slate-200 whitespace-pre-wrap">
                                        {formatPreText(tc.input)}
                                    </pre>
                                </div>

                                <div>
                                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Expected Output:</span>
                                    <pre className="mt-1 rounded-lg bg-slate-900 border border-slate-800 p-3 text-emerald-400 whitespace-pre-wrap">
                                        {formatPreText(tc.expectedOutput)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
