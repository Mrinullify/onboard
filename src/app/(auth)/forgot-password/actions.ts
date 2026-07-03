"use server"

import { prisma } from "@/lib/prisma";
import { ForgotPasswordFormData } from "./schema";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendForgotPasswordEmail } from "@/lib/email";

export async function forgotPassword(data: ForgotPasswordFormData) {
    try {
        const { email } = data;
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            }
        })

        if (!user) {
            return { success: false, message: "User not found" };
        }


        if (!user.password) {
            return {
                success: false,
                message: "This account was registered with Google. Please login with Google"
            }
        }

        const otp = await generateOTP();
        const storeOTPResponse = await storeOTP(email, otp);

        if (!storeOTPResponse) {
            return { success: false, message: "Failed to store verification code" };
        }

        const codeSender = await sendForgotPasswordEmail(email, otp);

        if (!codeSender) {
            return { success: false, message: "Failed to send verification code" };
        }

        return { success: true, message: "Verification code sent successfully" };

    } catch (error) {
        return { success: false, message: "Failed to send verification code" };
    }
}