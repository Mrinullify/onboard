
export const QUESTION_RULES = {
    MCQ: {
        timeLimit: 60,
        estimatedMinutes: 1,
        marks: 1,
    },

    SCENARIO: {
        timeLimit: 240,
        estimatedMinutes: 4,
        marks: 5,
    },

    CODING: {
        timeLimit: 1800,
        estimatedMinutes: 30,
        marks: 10,
    },
} as const;

/**
 * Percentage thresholds for determining AssessmentResult.
 * Evaluated top-down — first match wins.
 */
export const RESULT_THRESHOLDS = [
    { minPercentage: 85, result: "EXCELLENT" as const },
    { minPercentage: 65, result: "GOOD" as const },
    { minPercentage: 45, result: "AVERAGE" as const },
    { minPercentage: 0, result: "NEEDS_IMPROVEMENT" as const },
] as const;

export function getResultFromPercentage(percentage: number): "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT" {
    for (const threshold of RESULT_THRESHOLDS) {
        if (percentage >= threshold.minPercentage) {
            return threshold.result;
        }
    }
    return "NEEDS_IMPROVEMENT";
}
