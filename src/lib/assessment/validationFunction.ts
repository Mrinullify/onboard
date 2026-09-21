import type { AssessmentSetup } from "@/components/assessment/types/assessment";
import { QUESTION_RULES } from "./constants";

type QuestionFormat = keyof typeof QUESTION_RULES;

function normalizeFormatLabel(
    format: string
): keyof typeof QUESTION_RULES | null {
    switch (format) {
        case "MCQ":
            return "MCQ";
        case "Coding":
        case "CODING":
            return "CODING";
        case "Scenario Based":
        case "SCENARIO":
        case "Scenario":
            return "SCENARIO";
        default:
            return null;
    }
}

export function validateAssessmentSetup(setup: AssessmentSetup) {
    const selectedFormats = setup.formats
        .map(normalizeFormatLabel)
        .filter((format): format is QuestionFormat => Boolean(format));

    const requiredMinutes = selectedFormats.reduce(
        (total, format) =>
            total + QUESTION_RULES[format].estimatedMinutes,
        0
    );

    const isValid = selectedFormats.length > 0 && requiredMinutes <= Number(setup.duration);

    return {
        isValid,
        requiredMinutes,
        selectedDuration: Number(setup.duration),
    };
}
