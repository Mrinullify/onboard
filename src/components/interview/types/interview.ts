export type Difficulty = "easy" | "medium" | "hard" | "";

export type InterviewSetup = {
    interviewType: "technical" | "hr" | "behavioral" | "coding" | "mixed" | "";
    role: string;
    experience: string;
    difficulty: Difficulty;
    topics: string[];
    formats: string[];
    duration: 15 | 30 | 45 | 60 | "";
    aiStyle: "friendly" | "professional" | "strict" | "faang" | "";
};