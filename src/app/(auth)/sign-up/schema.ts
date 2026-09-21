import z from "zod";

export const signUpSchema = z
    .object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(32, "Name must be at most 32 characters"),

        email: z
            .string()
            .email("Please enter a valid email"),

        password: z
            .string()
            .min(4, "Password must be at least 4 characters")
            .max(32, "Password must be at most 32 characters"),

        confirmPassword: z.string(),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    );

export type SignUpFormData = z.infer<typeof signUpSchema>;