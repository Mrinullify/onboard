import { z } from "zod";
import { BaseQuestionSchema } from "./common";

const TestCaseSchema = z.object({
    input: z.string(),
    expectedOutput: z.string(),
});

// Full server-side metadata schema (includes hiddenTestCases)
export const CodingMetadataSchema = z.object({
    language: z.string().min(1, "Language is required"),
    starterCode: z.string().min(1, "Starter code is required"),
    constraints: z.array(z.string()),
    visibleTestCases: z.array(TestCaseSchema).min(1, "At least one visible test case is required"),
    hiddenTestCases: z.array(TestCaseSchema).min(1, "At least one hidden test case is required"),
});

export const CodingSchema = BaseQuestionSchema.extend({
    questionType: z.literal("CODING"),
    metadata: CodingMetadataSchema,
});

// Client-safe metadata schema (visibleTestCases ONLY)
export const ClientCodingMetadataSchema = z.object({
    language: z.string(),
    starterCode: z.string(),
    constraints: z.array(z.string()),
    visibleTestCases: z.array(TestCaseSchema),
});

export const ClientCodingSchema = BaseQuestionSchema.extend({
    questionType: z.literal("CODING"),
    metadata: ClientCodingMetadataSchema,
});