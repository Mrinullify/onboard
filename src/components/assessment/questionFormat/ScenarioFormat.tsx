import { EnrichedScenario } from "@/schemas/question";

interface Props {
    question: EnrichedScenario;
}

export default function ScenarioFormat({ question }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-xl font-medium leading-8">
                    Scenario
                </h3>

                <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
                    <p className="whitespace-pre-line leading-8 text-slate-200">
                        {question.questionText}
                    </p>
                </div>
            </div>

            {/* Candidate Response Guideline Callout */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Response Guideline
                </p>
                <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                    Write a <strong>3–4 sentence response</strong> addressing the scenario. AI will evaluate your submission against the criteria and rubric below.
                </p>
            </div>

            {/* Evaluation Criteria & Rubric */}
            {/* {question.metadata.evaluationCriteria && question.metadata.evaluationCriteria.length > 0 && (
                <div className="rounded-xl border border-blue-700 bg-blue-950/20 p-5 space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                        Evaluation Criteria
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {question.metadata.evaluationCriteria.map((item, index) => (
                            <span
                                key={index}
                                className="rounded-full border border-blue-600/50 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                            >
                                {item}
                            </span>
                        ))}
                    </div>

                    {question.metadata.rubric && question.metadata.rubric.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-blue-900/50 space-y-2">
                            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                Scoring Rubric
                            </p>
                            <div className="grid gap-2">
                                {question.metadata.rubric.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300">
                                        <span>{r.criterion}</span>
                                        <span className="font-bold text-blue-400">{r.points} marks</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )} */}
        </div>
    );
}
