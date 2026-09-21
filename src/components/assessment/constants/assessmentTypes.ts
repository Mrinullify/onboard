import { AssessmentType } from "../sections/AssessmentTypeSection";

export const assessmentTypes: {
    id: AssessmentType;
    title: string;
    desc: string;
    icon: string;
}[] = [
        {
            id: "technical",
            title: "Technical",
            desc: "DSA, System Design, CS Fundamentals",
            icon: "💻",
        },
        {
            id: "hr",
            title: "HR",
            desc: "Behavioral and culture-fit questions",
            icon: "👤",
        },
        {
            id: "behavioral",
            title: "Behavioral",
            desc: "Scenario-based thinking questions",
            icon: "🧠",
        },
        {
            id: "coding",
            title: "Coding",
            desc: "Live coding problems in editor",
            icon: "⌨️",
        },
        {
            id: "mixed",
            title: "Mixed",
            desc: "Balanced assessment (Recommended)",
            icon: "🎯",
        },
    ];
