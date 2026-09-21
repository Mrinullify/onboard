import { z } from "zod";
import { BaseQuestionSchema } from "./common";

export const MCQMetadataSchema = z.object({
    options: z.array(z.string().trim().min(1))
        .length(4, "options must contain exactly 4 choices")
        .refine(
            (items) => new Set(items.map((s) => s.toLowerCase())).size === 4,
            { message: "options must contain 4 unique choices without duplicates" }
        ),
    correctAnswer: z.string().trim().min(1),
    explanation: z.string().trim().min(1),
}).refine(
    (data) => data.options.some((opt) => opt.trim() === data.correctAnswer.trim()),
    {
        message: "correctAnswer must be identical to one of the 4 options",
        path: ["correctAnswer"],
    }
);

export const MCQSchema = BaseQuestionSchema.extend({
    questionType: z.literal("MCQ"),
    metadata: MCQMetadataSchema,
});
