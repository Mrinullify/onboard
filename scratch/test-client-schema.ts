import { EnrichedQuestionsSchema } from "../src/schemas/question";

const sanitizedQuestionFromFetchQuestions = [
    {
        id: "cm123",
        questionType: "CODING",
        difficulty: "EASY",
        topic: "Java",
        questionText: "Sum two numbers",
        timeLimit: 60,
        marks: 10,
        metadata: {
            language: "java",
            starterCode: "public class Main {}",
            constraints: ["a >= 0"],
            visibleTestCases: [{ input: "1 2", expectedOutput: "3" }]
            // hiddenTestCases is INTENTIONALLY ABSENT
        }
    }
];

try {
    const parsed = EnrichedQuestionsSchema.parse(sanitizedQuestionFromFetchQuestions);
    console.log("✅ Client EnrichedQuestionsSchema parsed sanitized payload successfully!");
    console.log("Parsed question metadata keys:", Object.keys(parsed[0].metadata));
} catch (err) {
    console.error("❌ Schema parsing failed:", err);
    process.exit(1);
}
