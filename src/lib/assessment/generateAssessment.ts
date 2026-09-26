import type { AssessmentSetup } from "@/components/assessment/types/assessment";

// Groq strict JSON schema for assessment questions response
// Mirrors Zod QuestionsResponseSchema but compatible with Groq strict mode
const GROQ_QUESTIONS_RESPONSE_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
        questions: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["questionText", "questionType", "topic", "metadata"],
                properties: {
                    questionText: { type: "string" },
                    questionType: { type: "string", enum: ["MCQ", "CODING", "SCENARIO"] },
                    topic: { type: "string" },
                    metadata: {
                        anyOf: [
                            // MCQ metadata
                            {
                                type: "object",
                                additionalProperties: false,
                                required: ["options", "correctAnswer", "explanation"],
                                properties: {
                                    options: {
                                        type: "array",
                                        items: { type: "string" },
                                        minItems: 4,
                                        maxItems: 4
                                    },
                                    correctAnswer: { type: "string" },
                                    explanation: { type: "string" }
                                }
                            },
                            // CODING metadata
                            {
                                type: "object",
                                additionalProperties: false,
                                required: ["language", "starterCode", "constraints", "visibleTestCases", "hiddenTestCases"],
                                properties: {
                                    language: { type: "string" },
                                    starterCode: { type: "string" },
                                    constraints: { type: "array", items: { type: "string" } },
                                    visibleTestCases: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            required: ["input", "expectedOutput"],
                                            properties: {
                                                input: { type: "string" },
                                                expectedOutput: { type: "string" }
                                            }
                                        }
                                    },
                                    hiddenTestCases: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            required: ["input", "expectedOutput"],
                                            properties: {
                                                input: { type: "string" },
                                                expectedOutput: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            },
                            // SCENARIO metadata
                            {
                                type: "object",
                                additionalProperties: false,
                                required: ["evaluationCriteria", "rubric"],
                                properties: {
                                    evaluationCriteria: { type: "array", items: { type: "string" } },
                                    rubric: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            required: ["criterion", "points", "description"],
                                            properties: {
                                                criterion: { type: "string" },
                                                points: { type: "number" },
                                                description: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
};
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
 * Normalizes test case inputs and expected outputs so that escaped newlines (\n, \\n, /n)
 * are properly converted to actual newline characters.
 */
export function normalizeTestCaseValue(val: unknown): string {
    if (val === undefined || val === null) return "";
    let formatted = String(val);

    // Convert literal \n or \\n characters if present as escaped strings
    formatted = formatted.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");

    // Convert literal /n or /r if mistakenly generated by LLM
    formatted = formatted.replace(/\/r\/n/g, "\n").replace(/\/n/g, "\n").replace(/\/r/g, "\n");

    // Normalize Windows line endings
    formatted = formatted.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Replace non-breaking space and other unicode spaces
    formatted = formatted.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");

    return formatted;
}

/**
 * Safely parses numbers from mathematical strings:
 * - Standard integers / floats: "100", "-50", "0", "1.5"
 * - Scientific notation: "1e5", "-1E9"
 * - Exponential notation: "10^5" -> 100000, "-10^5" -> -100000, "2^10" -> 1024, "10**5" -> 100000
 * - Exponential with offset: "2^31-1" -> 2147483647
 * Returns null if the string cannot be reliably parsed.
 */
export function parseMathNumber(str: string): number | null {
    if (!str || typeof str !== "string") return null;
    const clean = str.trim().replace(/\s+/g, "");

    // Exponential notation with offset e.g. "2^31-1", "10^9+7"
    const expOffsetMatch = clean.match(/^(-)?(\d+)(?:\^|\*\*)(\d+)([+-]\d+)$/);
    if (expOffsetMatch) {
        const sign = expOffsetMatch[1] === "-" ? -1 : 1;
        const base = parseFloat(expOffsetMatch[2]);
        const exp = parseFloat(expOffsetMatch[3]);
        const offset = parseFloat(expOffsetMatch[4]);
        if (!isNaN(base) && !isNaN(exp) && !isNaN(offset)) {
            return sign * Math.pow(base, exp) + offset;
        }
    }

    // Exponential notation e.g. "10^5", "-10^5", "2^10", "10**3"
    const expMatch = clean.match(/^(-)?(\d+)(?:\^|\*\*)(\d+)$/);
    if (expMatch) {
        const sign = expMatch[1] === "-" ? -1 : 1;
        const base = parseFloat(expMatch[2]);
        const exp = parseFloat(expMatch[3]);
        if (!isNaN(base) && !isNaN(exp)) {
            return sign * Math.pow(base, exp);
        }
    }

    // Standard integer / float / scientific notation e.g. "1000", "-500", "1e5"
    if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(clean)) {
        const val = parseFloat(clean);
        return isNaN(val) ? null : val;
    }

    return null;
}

/**
 * Validates generated test cases against question constraints.
 * Supports:
 * - Range constraints: "1 <= N <= 100", "-1000 <= A[i] <= 1000", "0 < X < 500"
 * - Unilateral constraints: "N >= 1", "N <= 100", "X > 0", "X < 1000"
 * - Length constraints: "1 <= |S| <= 100", "1 <= length <= 50"
 * 
 * Safe-failing: If a constraint cannot be parsed or matched with confidence, it logs a note and passes (returns valid: true).
 * Rejection occurs ONLY when there is clear, unambiguous proof of constraint violation.
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

        for (const rawConstraint of metadata.constraints) {
            if (typeof rawConstraint !== "string") continue;
            const constraintStr = rawConstraint.trim();
            if (!constraintStr) continue;

            // Pattern 1: Double-sided range: "<Left> <Op1> <Var> <Op2> <Right>"
            // e.g. "1 <= N <= 100", "-1000 <= A[i] <= 1000", "-10^5 <= arr[i] <= 10^5", "0 < |S| < 500"
            const rangeMatch = constraintStr.match(/^([^<>=]+?)\s*(<=|<)\s*([^<>=]+?)\s*(<=|<)\s*([^<>=]+?)$/);

            if (rangeMatch) {
                const leftStr = rangeMatch[1].trim();
                const op1 = rangeMatch[2];
                const varName = rangeMatch[3].trim().toLowerCase();
                const op2 = rangeMatch[4];
                const rightStr = rangeMatch[5].trim();

                const minVal = parseMathNumber(leftStr);
                const maxVal = parseMathNumber(rightStr);

                // If either boundary cannot be parsed into a real number, do not guess -> skip safely
                if (minVal === null || maxVal === null) {
                    continue;
                }

                const effectiveMin = op1 === "<=" ? minVal : minVal + 1;
                const effectiveMax = op2 === "<=" ? maxVal : maxVal - 1;

                // Check 1: Array element constraint e.g. A[i], arr[i], elements, numbers
                const isElementConstraint = /\[|\bi\b|\bj\b|element|value|number|item/.test(varName);

                // Check 2: Size / count constraint e.g. N, length, |S|, size, count, M, K
                const isSizeConstraint = /^(n|m|k|size|count|len|length|\|s\||string\s*length|array\s*length)$/.test(varName) || varName.includes("length") || varName.includes("size");

                for (const [index, tc] of allTestCases.entries()) {
                    const inputStr = String(tc.input || "").trim();
                    if (!inputStr) continue;

                    const lines = inputStr.split("\n").map(l => l.trim()).filter(Boolean);

                    // If it's a size/length constraint on N (first integer or string length)
                    if (isSizeConstraint && !isElementConstraint) {
                        const firstLineFirstToken = lines[0]?.split(/\s+/)[0];
                        if (firstLineFirstToken && /^-?\d+$/.test(firstLineFirstToken)) {
                            const firstNum = parseInt(firstLineFirstToken, 10);
                            if (!isNaN(firstNum)) {
                                if (firstNum < effectiveMin || firstNum > effectiveMax) {
                                    return {
                                        valid: false,
                                        reason: `Test case ${index + 1} parameter (${firstNum}) violates constraint "${constraintStr}" (allowed range: [${effectiveMin}, ${effectiveMax}])`,
                                    };
                                }
                            }
                        }
                    }

                    // If it's an element constraint (e.g. -1000 <= A[i] <= 1000)
                    if (isElementConstraint) {
                        const tokens = inputStr.match(/-?\d+(?:\.\d+)?/g);
                        if (tokens) {
                            for (const tok of tokens) {
                                const val = parseFloat(tok);
                                if (!isNaN(val)) {
                                    if (val < effectiveMin || val > effectiveMax) {
                                        return {
                                            valid: false,
                                            reason: `Test case ${index + 1} element (${val}) violates constraint "${constraintStr}" (allowed range: [${effectiveMin}, ${effectiveMax}])`,
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                continue;
            }

            // Pattern 2: Single-sided inequality: "<Var> >= <Expr>" or "<Var> <= <Expr>" or "<Expr> <= <Var>"
            const singleMatch = constraintStr.match(/^([^<>=]+?)\s*(>=|>|<=|<)\s*([^<>=]+?)$/);
            if (singleMatch) {
                const leftPart = singleMatch[1].trim();
                const op = singleMatch[2];
                const rightPart = singleMatch[3].trim();

                let varName = "";
                let boundVal: number | null = null;
                let isLowerBound = false;
                let isInclusive = op.includes("=");

                if (parseMathNumber(rightPart) !== null) {
                    varName = leftPart.toLowerCase();
                    boundVal = parseMathNumber(rightPart);
                    isLowerBound = op.startsWith(">");
                } else if (parseMathNumber(leftPart) !== null) {
                    varName = rightPart.toLowerCase();
                    boundVal = parseMathNumber(leftPart);
                    isLowerBound = op.startsWith("<");
                }

                if (boundVal === null) continue;

                const isElementConstraint = /\[|\bi\b|\bj\b|element|value|number|item/.test(varName);

                for (const [index, tc] of allTestCases.entries()) {
                    const inputStr = String(tc.input || "").trim();
                    if (!inputStr) continue;

                    const tokens = inputStr.match(/-?\d+(?:\.\d+)?/g);
                    if (!tokens) continue;

                    if (isElementConstraint) {
                        for (const tok of tokens) {
                            const val = parseFloat(tok);
                            if (isNaN(val)) continue;
                            const violates = isLowerBound
                                ? (isInclusive ? val < boundVal : val <= boundVal)
                                : (isInclusive ? val > boundVal : val >= boundVal);
                            if (violates) {
                                return {
                                    valid: false,
                                    reason: `Test case ${index + 1} element (${val}) violates constraint "${constraintStr}"`,
                                };
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
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
- Prefer simple, readable, standard numeric bounds in "constraints" array (e.g. "1 <= N <= 100", "-1000 <= A[i] <= 1000", "0 <= X <= 1000"). Avoid exponential notation (e.g. 10^5) unless strictly necessary.
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
          "-1000 <= A[i] <= 1000"
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
                max_completion_tokens: 4096,
                // @ts-ignore: Groq SDK typings lack json_schema support
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "assessment_questions",
                        strict: true,
                        schema: GROQ_QUESTIONS_RESPONSE_SCHEMA,
                    },
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

                        // Normalize test case fields to clean strings with real newlines
                        if (Array.isArray(meta.visibleTestCases)) {
                            meta.visibleTestCases = meta.visibleTestCases.map((tc: any) => ({
                                input: normalizeTestCaseValue(tc.input),
                                expectedOutput: normalizeTestCaseValue(tc.expectedOutput),
                            }));
                        }

                        if (Array.isArray(meta.hiddenTestCases)) {
                            meta.hiddenTestCases = meta.hiddenTestCases.map((tc: any) => ({
                                input: normalizeTestCaseValue(tc.input),
                                expectedOutput: normalizeTestCaseValue(tc.expectedOutput),
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
