import { z } from "zod";

import { MCQSchema } from "./mcq";
import { CodingSchema, ClientCodingSchema } from "./coding";
import { ScenarioSchema } from "./scenario";
import { enrichSchema } from "./common";

// Full server-side question schemas
export const QuestionSchema = z.discriminatedUnion("questionType", [
    MCQSchema,
    CodingSchema,
    ScenarioSchema,
]);

export const QuestionsSchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
export type Questions = z.infer<typeof QuestionsSchema>;

export const QuestionsResponseSchema = z.object({
    questions: QuestionsSchema,
});


// ---------------------------------------- Enriched ones ----------------------------------

export const EnrichedMCQSchema = enrichSchema(MCQSchema);
export type EnrichedMCQ = z.infer<typeof EnrichedMCQSchema>;

// Full Server-side Coding schema (includes hiddenTestCases)
export const EnrichedCodingSchema = enrichSchema(CodingSchema);
export type EnrichedCoding = z.infer<typeof EnrichedCodingSchema>;

// Client-safe Coding schema (visibleTestCases ONLY)
export const EnrichedClientCodingSchema = enrichSchema(ClientCodingSchema);
export type EnrichedClientCoding = z.infer<typeof EnrichedClientCodingSchema>;

export const EnrichedScenarioSchema = enrichSchema(ScenarioSchema);
export type EnrichedScenario = z.infer<typeof EnrichedScenarioSchema>;


// Full server-side enriched question schema
export const ServerEnrichedQuestionSchema = z.discriminatedUnion("questionType", [
    EnrichedMCQSchema,
    EnrichedCodingSchema,
    EnrichedScenarioSchema,
]);
export const ServerEnrichedQuestionsSchema = z.array(ServerEnrichedQuestionSchema);
export type ServerEnrichedQuestion = z.infer<typeof ServerEnrichedQuestionSchema>;
export type ServerEnrichedQuestions = z.infer<typeof ServerEnrichedQuestionsSchema>;


// Client-safe enriched question schema (used by AssessmentPlayer & client components)
export const EnrichedQuestionSchema = z.discriminatedUnion("questionType", [
    EnrichedMCQSchema,
    EnrichedClientCodingSchema,
    EnrichedScenarioSchema,
]);

export const EnrichedQuestionsSchema = z.array(EnrichedQuestionSchema);

export type EnrichedQuestion = z.infer<typeof EnrichedQuestionSchema>;
export type EnrichedQuestions = z.infer<typeof EnrichedQuestionsSchema>;