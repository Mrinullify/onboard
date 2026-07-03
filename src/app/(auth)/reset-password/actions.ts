"use server";

import { ResetPasswordFormData } from "./schema";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function resetPassword(data: ResetPasswordFormData, token: string) {
    try {
        const { password } = data;

        const email = await redis.get<string>(
            `reset-token:${token}`
        );

        if (!email) {
            return {
                success: false,
                message: "Token expired",
            };
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return {
                success: false,
                message: "User not found",
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        });

        // Delete all sessions for that current user
        await prisma.session.deleteMany({
            where: {
                userId: user.id,
            },
        });

        await redis.del(`reset-token:${token}`);

        return {
            success: true,
            message: "Password reset successfully",
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Failed to reset password",
        };
    }
}