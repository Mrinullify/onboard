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
    } catch (error: any) {
        let errorMessage = "Invalid email or password";
        
        if (error.type === "CredentialsSignin") {
            errorMessage = error.message || "Invalid credentials";
            // Auth.js sometimes wraps the error message with 'CredentialsSignin: '
            if (errorMessage.startsWith("CredentialsSignin: ")) {
                errorMessage = errorMessage.replace("CredentialsSignin: ", "");
            }
        }

        return {
            success: false,
            message: errorMessage,
        };
    }
}
