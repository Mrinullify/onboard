"use server";

import { sendOTPEmail } from "@/lib/email";
import { generateOTP, storeOTP, verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

// For Sign-up verification
export async function verifySignupOTPAction(email: string, otp: string) {
    // check if otp is valid
    const res = await verifyOTP(email, otp);

    if (!res.success) {
        return res;
    }

    // register user
    if (res.success) {
        const userData = await redis.get<{
            name: string;
            email: string;
            password: string;
        }>(`pending-user:${email}`);

        if (!userData) {
            return {
                success: false,
                message: "Registration data expired",
            };
        }

        // check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: userData.email,
            },
        });

        if (existingUser) {
            return {
                success: false,
                message: "User already exists",
            };
        }

        await prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                emailVerified: new Date().toISOString(),
            },
        });

        await redis.del(`pending-user:${email}`);
        await redis.del(`otp:${email}`);

        return {
            success: true,
            message: "User registered successfully",
        }
    }

    return {
        success: false,
        message: "Something went wrong",
    }
}

// For Forgot Password Verification
export async function verifyForgotPasswordOTPAction(
    email: string,
    otp: string
) {
    try {
        const res = await verifyOTP(email, otp);

        if (!res.success) {
            return res;
        }

        const token = crypto.randomUUID();

        await redis.set(
            `reset-token:${token}`,
            email,
            { ex: 600 } // 10 min
        );

        // OTP is no longer needed
        await redis.del(`otp:${email}`);

        return {
            success: true,
            message: "OTP verified successfully",
            token,
        };

    } catch (error) {
        console.error(error);

        return {
            success: false,
            message: "Something went wrong",
        };
    }
}

export async function resendOTP(email: string) {
    if (!email) return { success: false, message: "Email is required" };

    try {
        const otp = await generateOTP();
        await storeOTP(email, otp);
        const res = await sendOTPEmail(email, otp);

        if (res.success) {
            return {
                success: true,
                message: "OTP resent successfully",
            };
        }

        return {
            success: false,
            message: "Failed to resend OTP",
        };
    } catch (error: any) {
        // Handles the cooldown error thrown by storeOTP gracefully
        return {
            success: false,
            message: error?.message || "Failed to resend OTP",
        };
    }
}