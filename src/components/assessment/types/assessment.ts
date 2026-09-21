export type Difficulty = "easy" | "medium" | "hard" | "";

export type Language = "C" | "C++" | "Java" | "Python" | "";

export type AssessmentSetup = {
    assessmentType: "technical" | "hr" | "behavioral" | "coding" | "mixed" | "";
    role: string;
    experience: string;
    difficulty: Difficulty;
    topics: string[];
    formats: string[];
    duration: 15 | 30 | 60 | 120;
    aiStyle: "friendly" | "professional" | "strict" | "faang" | "";
    language: Language;
};
