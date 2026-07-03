"use client";

import Link from "next/link";
import Logo from "@/components/shared/Logo";

import { useState } from "react";
import { toast } from "sonner";

import { ArrowLeft, KeyRound, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordFormData, resetPasswordSchema } from "./schema";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "./actions";


export default function ResetPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");


    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function handleResetPassword(
        values: ResetPasswordFormData
    ) {
        try {
            if (!token) {
                toast.error("Token not found or expired");
                return;
            }
            setIsSubmitting(true);
            const res = await resetPassword({ ...values }, token);

            if (res.success) {
                toast.success(res.message);
                router.push("/sign-in");
            }
            else {
                toast.error(res.message);
            }

        } catch (error) {
            toast.error("Failed to reset password");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* LEFT SIDE */}
            <div className="relative w-full lg:w-3/5 flex items-center justify-center px-8">
                <div className="absolute top-0 left-4">
                    <Logo />
                </div>

                <div className="w-full max-w-md space-y-6">
                    {/* HEADER */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-8 w-8 text-primary" />

                            <h1 className="text-3xl font-semibold font-mono">
                                Reset Password
                            </h1>
                        </div>

                        <p className="text-muted-foreground">
                            Create a new password for your
                            account. Make sure it is strong
                            and easy for you to remember.
                        </p>
                    </div>

                    {/* FORM */}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleResetPassword)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            New Password
                                        </FormLabel>

                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                <Input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Confirm Password
                                        </FormLabel>

                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                <Input
                                                    type="password"
                                                    placeholder="Confirm new password"
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
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>

                            <Button
                                asChild
                                variant="ghost"
                                className="w-full"
                            >
                                <Link href="/sign-in">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
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
                        Keep Your Account Secure
                    </h2>

                    <p className="text-xl leading-relaxed">
                        Choose a strong password that you
                        don't use anywhere else. Your account
                        security starts here.
                    </p>
                </div>
            </div>
        </div>
    );
}