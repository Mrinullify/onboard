"use client";

import Link from "next/link";
import Logo from "@/components/shared/Logo";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormLabel
} from "@/components/ui/form";

import { useState } from "react";
import { toast } from "sonner";

import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { ForgotPasswordFormData, forgotPasswordSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "./actions";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function sendVerifyCode(values: ForgotPasswordFormData) {
        try {
            setIsSubmitting(true);
            const res = await forgotPassword(values);

            if (!res.success) {
                toast.error(res.message);
            }

            toast.success(res.message);
            router.push(`/verify/${encodeURIComponent(values.email)}?type=reset-password`);

        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* LEFT SIDE */}
            <div className="relative w-full lg:w-3/5 flex items-center justify-center px-8">
                {/* LOGO */}
                <div className="absolute top-0 left-4 flex items-center">
                    <Logo />
                </div>

                <div className="w-full max-w-md space-y-6">
                    {/* HEADER */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LockKeyhole className="h-8 w-8 text-primary" />

                            <h1 className="text-3xl font-semibold font-mono">
                                Forgot Password
                            </h1>
                        </div>

                        <p className="text-muted-foreground">
                            Forgot your password? No worries.
                            Enter your email address and we'll
                            send you a verification code to
                            reset it.
                        </p>
                    </div>

                    {/* FORM */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(sendVerifyCode)}>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>

                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                <Input
                                                    type="email"
                                                    placeholder="Email"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full mt-3"
                                disabled={
                                    isSubmitting
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Code...
                                    </>
                                ) : (
                                    "Send Verification Code"
                                )}
                            </Button>

                            <Button
                                asChild
                                variant="ghost"
                                className="w-full mt-3"
                            >
                                <Link
                                    href="/sign-in"
                                    className="flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign In
                                </Link>
                            </Button>
                        </form>
                    </Form>

                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-800 via-emerald-600 to-blue-300 items-center justify-center p-10">
                <div className="max-w-md text-white text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Secure Account Recovery
                    </h2>

                    <p className="text-xl leading-relaxed">
                        We'll verify your identity using a
                        one-time code sent directly to your
                        email address before allowing any
                        password changes.
                    </p>
                </div>
            </div>
        </div>
    );
}

