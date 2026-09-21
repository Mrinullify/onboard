"use client";

import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { resendOTP, verifyForgotPasswordOTPAction, verifySignupOTPAction } from "./actions";

function VerifyPageContent() {
    const [otpLoading, setOtpLoading] = useState(false);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const email = params?.email ? decodeURIComponent(params.email as string) : "";
    const type = searchParams.get("type");

    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setTimeout(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft]);

    // On Resend OTP
    const onResend = async () => {
        if (!email) return;
        try {
            const res = await resendOTP(email);
            if (res?.success) {
                toast.success(res.message);
                setTimeLeft(60);
            }
        } catch (error) {
            toast.error("Failed to resend OTP");
        }
    };

    // On Submit OTP
    const onSubmitCode = async () => {
        try {
            if (!email) return;

            setOtpLoading(true);

            let res;

            switch (type) {
                case "sign-up":
                    res = await verifySignupOTPAction(email, otp);
                    break;

                case "forgot-password":
                    res = await verifyForgotPasswordOTPAction(email, otp);
                    break;

                default:
                    toast.error("Invalid verification type");
                    return;
            }

            if (!res.success) {
                toast.error(res.message);
                return;
            }

            toast.success(res.message);

            if (type === "sign-up") {
                // Bug 3 fix: was router.push("/dashboard") — user has no session yet.
                // Redirect to sign-in with ?verified=true so it shows a success toast.
                router.push("/sign-in?verified=true");
            }

            if (type === "forgot-password" && res.success && "token" in res) {
                router.push(`/reset-password?token=${res.token}`);
            }
        } catch (error) {
            toast.error("Failed to verify OTP");
        } finally {
            setOtpLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sky-400 via-white to-violet-400">
            <Card className="w-full max-w-md border-slate-400 bg-white/95 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border">
                        <Mail className="h-5 w-5" />
                    </div>

                    <div>
                        <CardTitle className="text-2xl">
                            Verify your email
                        </CardTitle>

                        <CardDescription className="mt-2">
                            <p className="text-center text-s text-muted-foreground">
                                We've sent a 6-digit verification code to
                            </p>
                            <span className="font-medium text-foreground">
                                {email || "[JohnDoe]"}
                            </span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>


                    <Button
                        onClick={onSubmitCode}
                        className="w-full"
                        disabled={otpLoading}
                    >
                        {otpLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify Email"
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>Didn't receive the code?</p>
                        {timeLeft > 0 ? (
                            <span>
                                Resend OTP in {timeLeft}s
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={onResend}
                                className="text-black ml-2 font-medium hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>

                    <p className="text-center text-s text-muted-foreground">
                        OTP expires in 5 minutes
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-white to-violet-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyPageContent />
        </Suspense>
    );
}