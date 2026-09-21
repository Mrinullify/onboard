import type { AssessmentSetup } from "@/components/assessment/types/assessment";
import { groq } from "../groq";
import { QUESTION_RULES } from "./constants";
import { ServerEnrichedQuestion, ServerEnrichedQuestions, ServerEnrichedQuestionsSchema, Question, QuestionsResponseSchema } from "@/schemas/question";


//  TYPE QUESTION PLAN
type QuestionPlan = {
    type: keyof typeof QUESTION_RULES;
    count: number;
};


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


// Function FOR ENRICHED QUESTION

function enrichQuestion(
    questions: Question[],
    setup: AssessmentSetup,
): ServerEnrichedQuestion[] {

    return questions.map((question) => ({
        ...question,

        difficulty: setup.difficulty.toUpperCase() as
            | "EASY"
            | "MEDIUM"
            | "HARD",

        timeLimit: QUESTION_RULES[question.questionType].timeLimit,

        marks: QUESTION_RULES[question.questionType].marks,

    }));
}


//  FUNCTION TO GENERATE QUESTION PLAN
function generateQuestionPlan(
    setup: AssessmentSetup
): QuestionPlan[] {

    const selectedFormats = setup.formats
        .map(normalizeFormatLabel)
        .filter((format): format is keyof typeof QUESTION_RULES => Boolean(format));

    let remainingMinutes = Number(setup.duration);

    // Give every selected format one question
    const plan = selectedFormats.map((format) => {
        remainingMinutes -= QUESTION_RULES[format].estimatedMinutes;

        return {
            type: format,
            count: 1,
        };
    });

    // Round-robin allocation
    while (true) {
        let addedQuestion = false;

        for (const format of selectedFormats) {
            const requiredTime =
                QUESTION_RULES[format].estimatedMinutes;

            if (requiredTime > remainingMinutes) {
                continue;
            }

            const question = plan.find(
                (q) => q.type === format
            );

            if (!question) continue;

            question.count++;
            remainingMinutes -= requiredTime;
            addedQuestion = true;
        }

        // No format could fit anymore
        if (!addedQuestion) {
            break;
        }
    }
    return plan;
}

const BATCH_LIMITS: Record<keyof typeof QUESTION_RULES, number> = {
    MCQ: 5,
    SCENARIO: 2,
    CODING: 1,
};

/**
 * Normalizes starter code without destructively rewriting valid generated code structure.
 */
export function formatStarterCode(code: string, language: string): string {
    if (!code || typeof code !== "string") return "";

    let formatted = code;

    // Convert literal \n or \\n characters if present as double-escaped strings
    if (formatted.includes("\\n")) {
        formatted = formatted.replace(/\\n/g, "\n");
    }
    if (formatted.includes("\\t")) {
        formatted = formatted.replace(/\\t/g, "    ");
    }

    // Normalize Windows line endings
    formatted = formatted.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Replace non-breaking space \u00a0 and other special unicode spaces with standard space
    formatted = formatted.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");

    // Non-destructive: Trim trailing spaces per line, maintain original line breaks and indentation
    const lines = formatted.split("\n").map((line) => line.trimEnd());
    formatted = lines.join("\n").trim();

    return formatted;
}

/**
 * Programmatically validates generated test cases against simple numeric constraints (e.g. 1 <= N <= 100).
 * Safe-failing: If a constraint cannot be parsed or recognized, it fails safely (returns valid: true).
 */
export function validateCodingQuestionConstraints(metadata: {
    constraints?: string[];
    visibleTestCases?: { input: string; expectedOutput: string }[];
    hiddenTestCases?: { input: string; expectedOutput: string }[];
}): { valid: boolean; reason?: string } {
    try {
        if (!metadata.constraints || !Array.isArray(metadata.constraints)) {
            return { valid: true };
        }

        const allTestCases = [
            ...(metadata.visibleTestCases || []),
            ...(metadata.hiddenTestCases || []),
        ];

        if (allTestCases.length === 0) return { valid: true };

        for (const constraintStr of metadata.constraints) {
            if (typeof constraintStr !== "string") continue;

            // Range pattern e.g. "1 <= N <= 100", "-10^5 <= A[i] <= 10^5", "0 < N < 50"
            const rangeMatch = constraintStr.match(/(-?\d+)\s*(<=|<)\s*([A-Za-z0-9_\[\]\s]+?)\s*(<=|<)\s*(-?\d+)/);
            if (rangeMatch) {
                const minVal = parseInt(rangeMatch[1], 10);
                const isMinInclusive = rangeMatch[2] === "<=";
                const maxVal = parseInt(rangeMatch[5], 10);
                const isMaxInclusive = rangeMatch[4] === "<=";

                if (isNaN(minVal) || isNaN(maxVal)) continue;

                const effectiveMin = isMinInclusive ? minVal : minVal + 1;
                const effectiveMax = isMaxInclusive ? maxVal : maxVal - 1;

                for (const [index, tc] of allTestCases.entries()) {
                    const inputStr = String(tc.input || "").trim();
                    const firstLine = inputStr.split("\n")[0]?.trim() || "";
                    const firstNumMatch = firstLine.match(/^-?\d+$/);

                    // Check if input's first line parameter (e.g. N) violates bounds
                    if (firstNumMatch) {
                        const firstNum = parseInt(firstNumMatch[0], 10);
                        if (!isNaN(firstNum)) {
                            if (firstNum < effectiveMin || firstNum > effectiveMax) {
                                return {
                                    valid: false,
                                    reason: `Test case ${index + 1} input parameter (${firstNum}) violates constraint "${constraintStr}" (allowed range: [${effectiveMin}, ${effectiveMax}])`,
                                };
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        // Safe-fail on any error
        console.warn("[validateCodingQuestionConstraints] Safe-fail warning:", err);
        return { valid: true };
    }

    return { valid: true };
}

const TYPE_PROMPTS: Record<keyof typeof QUESTION_RULES, (language?: string) => string> = {
    MCQ: () => `Instructions:
- In "metadata.options", provide an array of EXACTLY 4 distinct strings.
- Never output more than 4 options (do NOT output 5, 6, or 8 options).
- All 4 options must be unique choices (no duplicate values).
- "correctAnswer" must be the EXACT string matching one of the 4 items in "options".
- Wrong options must be realistic and relevant to the question.
- Avoid "All of the above" or "None of the above".
- Do NOT include any extra metadata fields.

Return ONLY this JSON shape:
{
  "questions": [
    {
      "questionText": "Question text...",
      "questionType": "MCQ",
      "topic": "Topic name",
      "metadata": {
        "options": [
          "Option 1",
          "Option 2",
          "Option 3",
          "Option 4"
        ],
        "correctAnswer": "Option 1",
        "explanation": "Clear explanation of why Option 1 is the correct answer."
      }
    }
  ]
}`,
    SCENARIO: () => `Instructions:
- Generate a real-world workplace or engineering problem-solving scenario.
- The questionText must prompt the candidate to write a concise response of 3–4 sentences explaining their approach/decision.
- Include "evaluationCriteria" (an array of evaluation points).
- Include "rubric" (an array of objects, each with "criterion", "points" as a number, and "description").
- Do NOT generate "suggestedAnswer" or any other extra fields.

Return ONLY this JSON shape:
{
  "questions": [
    {
      "questionText": "Scenario description and candidate prompt...",
      "questionType": "SCENARIO",
      "topic": "Topic name",
      "metadata": {
        "evaluationCriteria": [
          "Criterion 1",
          "Criterion 2"
        ],
        "rubric": [
          { "criterion": "Core Approach", "points": 2, "description": "Sound engineering decision making" },
          { "criterion": "Trade-offs & Edge Cases", "points": 3, "description": "Identifies critical constraints and alternatives" }
        ]
      }
    }
  ]
}`,
    CODING: (language = "Java") => `Instructions:
- Use ${language} only.
- Difficulty must match the assessment configuration.
- The problem should be reasonably solvable in approximately 30 minutes.
- Provide minimal executable starter code for ${language} with proper indentation and real newlines.
- Do not include actual solution logic in starterCode.
- The program must read input from standard input (stdin) and write the answer to standard output (stdout).
- For Java, starterCode must be a complete executable Java program with a Main class and main method.
- State clear mathematical bounds in "constraints" array (e.g. "1 <= N <= 100", "-10^5 <= A[i] <= 10^5").
- CRITICAL: ALL test cases (visible and hidden) MUST strictly obey all stated constraints. Never generate a test case input outside stated bounds.
- Provide 2+ visible test cases and 3+ hidden test cases.
- Visible and hidden test cases must follow exactly the same input/output format.
- expectedOutput must be 100% correct for the given input.

Return ONLY this JSON shape:
{
  "questions": [
    {
      "questionText": "Detailed problem description with input/output format...",
      "questionType": "CODING",
      "topic": "Topic name",
      "metadata": {
        "language": "${language}",
        "starterCode": "import java.util.Scanner;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n    }\\n}",
        "constraints": [
          "1 <= N <= 100",
          "-10^5 <= A[i] <= 10^5"
        ],
        "visibleTestCases": [
          { "input": "...", "expectedOutput": "..." }
        ],
        "hiddenTestCases": [
          { "input": "...", "expectedOutput": "..." }
        ]
      }
    }
  ]
}`
};


const DEFAULT_TOPICS = [
    "Cloud Computing",
    "Computer Networks",
    "Data Structures & Algorithms",
    "C",
    "C++",
    "Java",
    "Python",
    "CS Fundamentals",
    "System Design",
    "Databases & SQL",
];

function buildQuestionPrompt(
    setup: AssessmentSetup,
    type: keyof typeof QUESTION_RULES,
    count: number
) {
    const typePrompt = TYPE_PROMPTS[type](setup.language || "Java");

    const allowedTopics = setup.topics && setup.topics.length > 0
        ? Array.from(new Set([...setup.topics, ...DEFAULT_TOPICS]))
        : DEFAULT_TOPICS;

    return `
You are a senior technical assessor. Return only valid JSON—no markdown or extra text.

Generate exactly ${count} unique ${type.replace("_", " ")} question${count === 1 ? "" : "s"}.

Assessment context:
- Role: ${setup.role}
- Assessment type: ${setup.assessmentType}
- Experience: ${setup.experience}
- Difficulty: ${setup.difficulty}
- Preferred language: ${setup.language || "Language agnostic / General"}
- Allowed topics: ${allowedTopics.join(", ")}

Every question must be drawn from the allowed topics and match the selected experience and difficulty.
${(type === "CODING" && setup.language) ? `\nFor coding questions, ALWAYS use ${setup.language} as the programming language.\n` : ""}
Type-specific instructions & expected JSON shape:
${typePrompt}`;
}

// Helper function to generate a batch of questions of a specific type with retry support
async function generateQuestionBatch(
    setup: AssessmentSetup,
    type: keyof typeof QUESTION_RULES,
    count: number,
    maxRetries = 2
): Promise<Question[]> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`[generateQuestionBatch] Retrying ${type} batch (Attempt ${attempt + 1}/${maxRetries + 1})...`);
            }

            const prompt = buildQuestionPrompt(setup, type, count);

            const completion = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                temperature: 0.3,
                response_format: {
                    type: "json_object",
                },
                messages: [
                    {
                        role: "system",
                        content: `You are a senior technical assessor.
Always follow instructions strictly.
Return ONLY valid JSON matching the requested schema.
For MCQ questions, every question MUST have an "options" array of EXACTLY 4 unique choices. Never generate 5, 6, or 8 options.
Never include markdown formatting, backticks, or additional text.`
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error("Groq returned an empty response.");
            }

            // Clean potential surrounding markdown blocks if present
            const cleanContent = content
                .trim()
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "");

            const rawParsed = JSON.parse(cleanContent);

            // Pre-validation metadata normalization & constraint check
            if (rawParsed && Array.isArray(rawParsed.questions)) {
                for (const q of rawParsed.questions) {
                    if (q.questionType === "CODING" && q.metadata) {
                        const meta = q.metadata;

                        if (meta.starterCode) {
                            meta.starterCode = formatStarterCode(
                                meta.starterCode,
                                meta.language || setup.language || "java"
                            );
                        }

                        // Coerce test case fields to string
                        if (Array.isArray(meta.visibleTestCases)) {
                            meta.visibleTestCases = meta.visibleTestCases.map((tc: any) => ({
                                input: String(tc.input ?? ""),
                                expectedOutput: String(tc.expectedOutput ?? ""),
                            }));
                        }

                        if (Array.isArray(meta.hiddenTestCases)) {
                            meta.hiddenTestCases = meta.hiddenTestCases.map((tc: any) => ({
                                input: String(tc.input ?? ""),
                                expectedOutput: String(tc.expectedOutput ?? ""),
                            }));
                        }

                        if (typeof meta.constraints === "string") {
                            meta.constraints = [meta.constraints];
                        }

                        const constraintCheck = validateCodingQuestionConstraints(meta);
                        if (!constraintCheck.valid) {
                            throw new Error(`Constraint check failed: ${constraintCheck.reason}`);
                        }
                    }
                }
            }

            const parsed = QuestionsResponseSchema.parse(rawParsed);

            if (parsed.questions.length !== count) {
                throw new Error(
                    `Expected ${count} questions of type ${type} but received ${parsed.questions.length}.`
                );
            }

            return parsed.questions;
        } catch (err) {
            lastError = err;
            console.warn(`[generateQuestionBatch] Attempt ${attempt + 1} failed for ${type}:`, err);
        }
    }

    throw lastError || new Error(`Failed to generate ${type} questions after ${maxRetries + 1} attempts.`);
}


//  FUNCTION TO GENERATE QUESTIONS FROM THE SETUP STATE
export async function generateAssessmentQuestions(
    setup: AssessmentSetup
): Promise<ServerEnrichedQuestions> {

    const questionPlan = generateQuestionPlan(setup);
    const allQuestions: Question[] = [];

    for (const planItem of questionPlan) {
        const type = planItem.type;
        const totalForType = planItem.count;
        let generatedForType = 0;

        while (generatedForType < totalForType) {
            const remaining = totalForType - generatedForType;
            const batchSize = Math.min(remaining, BATCH_LIMITS[type]);

            console.log(`Generating batch of ${batchSize} questions for type ${type}. Remaining: ${remaining}`);
            const batch = await generateQuestionBatch(setup, type, batchSize);

            allQuestions.push(...batch);
            generatedForType += batch.length;
        }
    }

    const enrichedQuestions = enrichQuestion(
        allQuestions,
        setup
    )

    const validatedQuestions = ServerEnrichedQuestionsSchema.parse(
        enrichedQuestions
    )

    return validatedQuestions;
};
