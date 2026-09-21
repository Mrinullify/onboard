import { z } from "zod";
import { BaseQuestionSchema } from "./common";

export const RubricItemSchema = z.object({
    criterion: z.string(),
    points: z.number(),
    description: z.string().optional(),
});

export const ScenarioMetadataSchema = z.object({
    evaluationCriteria: z.array(z.string()),
    rubric: z.array(RubricItemSchema),
});

export const ScenarioSchema = BaseQuestionSchema.extend({
    questionType: z.literal("SCENARIO"),
    metadata: ScenarioMetadataSchema,
});