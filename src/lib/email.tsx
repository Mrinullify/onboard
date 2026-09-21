import { resend } from "./resend";
import VerificationCompo from "@/emails/VerificationCompo";
import ForgotPasswordCompo from "@/emails/ForgotPassCompo";

export async function sendOTPEmail(email: string, otp: string) {
    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Onboard | Verification Code",
            react: <VerificationCompo email={email} otp={otp} />,

        })

        return { success: true, message: 'Verification email sent successfully' }
    } catch (error) {
        console.log(error)
        return { success: false, error: error, message: "Failed to send verification email" }
    }
}

export async function sendForgotPasswordEmail(email: string, otp: string) {
    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Onboard | Forgot Password",
            react: <ForgotPasswordCompo email={email} otp={otp} />,

        })

        return { success: true, message: 'Verification email sent successfully' }
    } catch (error) {
        return { success: false, error: error, message: "Failed to send verification email" }
    }
}
