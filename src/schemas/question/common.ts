import { z } from "zod";

export const DifficultySchema = z.enum([
    "EASY",
    "MEDIUM",
    "HARD"
]);

export const QuestionTypeSchema = z.enum([
    "MCQ",
    "CODING",
    "SCENARIO"
]);

export const BaseQuestionSchema = z.object({
    id: z.string().optional(),

    questionText: z.string(),

    questionType: QuestionTypeSchema,

    topic: z.string(),
});


export const enrichSchema = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return schema.extend({
        difficulty: DifficultySchema,
        timeLimit: z.number(),
        marks: z.number(),
    });
}