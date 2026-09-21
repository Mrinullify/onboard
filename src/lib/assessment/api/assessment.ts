import { AssessmentSetup } from "@/components/assessment/types/assessment";
type StartAssessmentResponse = {
    assessmentId: string;
    attemptId: string;
    totalQuestions: number;
    message: string;
};

export async function startAssessment(setup: AssessmentSetup): Promise<StartAssessmentResponse> {
    const response = await fetch("/api/assessment/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            setup,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to start assessment");
    }

    return response.json();
}
