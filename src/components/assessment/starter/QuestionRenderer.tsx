import { EnrichedQuestion } from "@/schemas/question";
import MCQFormat from "../questionFormat/MCQFormat";
import ScenarioFormat from "../questionFormat/ScenarioFormat";
import CodingFormat from "../questionFormat/CodingFormat";


interface Props {
    question: EnrichedQuestion;
    answer: string;
    setAnswer: (value: string) => void;
}

export default function QuestionRenderer({ question, answer, setAnswer }: Props) {
    switch (question.questionType) {
        case "MCQ":
            return <MCQFormat question={question} answer={answer} setAnswer={setAnswer} />;

        case "SCENARIO":
            return <ScenarioFormat question={question} />;

        case "CODING":
            return <CodingFormat question={question} />;

        default:
            return <p>Unsupported question type.</p>;
    }
}
