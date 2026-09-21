import z from "zod";

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(4, "Password must be at least 4 characters")
            .max(32, "Password must be at most 32 characters"),

        confirmPassword: z
            .string()
            .min(4, "Password must be at least 4 characters")
            .max(32, "Password must be at most 32 characters"),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            path: ["confirmPassword"],
            message: "Passwords do not match",
        }
    );

export type ResetPasswordFormData = z.infer<
    typeof resetPasswordSchema
>;