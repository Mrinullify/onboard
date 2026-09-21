import { redis } from "./redis";
import bcrypt from "bcryptjs";


export async function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email: string, otp: string) {

    // before generating otp rate limit it
    const cooldown = await redis.get(`otp-limit:${email}`);

    if (cooldown) {
        throw new Error(`Please wait before generating a new OTP`);
    }

    const hashedOtp = await bcrypt.hash(otp, 10);

    // store otp
    await redis.set(`otp:${email}`, hashedOtp, { ex: 600 });

    // set cooldown
    await redis.set(`otp-limit:${email}`, "banana", { ex: 60 });

    // send otp
    return hashedOtp;
}

export async function verifyOTP(email: string, otp: string) {

    const hashedOtp = await redis.get<string>(`otp:${email}`);

    if (!hashedOtp) return { success: false, message: "OTP not found or expired" };

    const isValid = await bcrypt.compare(otp, hashedOtp);

    return { success: isValid, message: "OTP verified successfully" };
}
