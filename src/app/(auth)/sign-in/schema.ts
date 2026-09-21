import z from "zod";

export const signInSchema = z
    .object({
        email: z
            .string()
            .email("Please enter a valid email"),

        password: z
            .string()
            .min(4, "Password must be at least 4 characters")
            .max(32, "Password must be at most 32 characters"),
    });

export type SignInFormData = z.infer<typeof signInSchema>;