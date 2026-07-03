"use server"

import { prisma } from "@/lib/prisma";
import { signIn } from "../../../../auth";
import { SignUpFormData, signUpSchema } from "./schema";
import bcrypt from "bcryptjs";
import { redis } from "@/lib/redis";
import { generateOTP, storeOTP, verifyOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function googleSignIn() {
    await signIn("google", {
        redirectTo: "/dashboard",
    });
}


export async function registerUser(data: SignUpFormData) {
    let redirectPath = "";
    try {
        const validateData = signUpSchema.parse(data);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: validateData.email,
            }
        })

        if (existingUser) {
            return {
                success: false,
                message: "User already exists",
            }
        }

        const hashedPassword = await bcrypt.hash(validateData.password, 10);


        // Save the user in redis 
        await redis.set(
            `pending-user:${validateData.email}`,
            JSON.stringify({
                name: validateData.name,
                email: validateData.email,
                password: hashedPassword,
            }),
            { ex: 600 }
        )

        // generate otp
        const otp = await generateOTP();

        // store otp in redis
        await storeOTP(validateData.email, otp);

        // send OTP email
        await sendOTPEmail(validateData.email, otp);

        redirectPath = `/verify/${encodeURIComponent(validateData.email)}?type=sign-up`;

    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Something went wrong",
        }
    }

    if (redirectPath) {
        redirect(redirectPath);
    }
}
