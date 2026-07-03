"use server";

import { signIn } from "../../../../auth";
import { SignInFormData } from "./schema";

export async function googleSignIn() {
    await signIn("google", {
        redirectTo: "/dashboard",
    });
}


export const signInCred = async (data: SignInFormData) => {
    const { email, password } = data;

    try {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            return {
                success: false,
                message: result.error,
            };
        }

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            message: "Invalid credentials",
        };
    }
}
