"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormLabel
} from "@/components/ui/form";
import Logo from "@/components/shared/Logo";
import Image from "next/image";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { googleSignIn, signInCred } from "./actions";
import { SignInFormData, signInSchema } from "./schema";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInPage() {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Bug 3 fix: Show a toast if user just verified their email
    useEffect(() => {
        if (searchParams.get("verified") === "true") {
            toast.success("Email verified! Please log in to continue.");
        }
    }, [searchParams]);

    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // through google
    async function handleGoogleSignIn() {
        setIsGoogleLoading(true);
        try {
            await googleSignIn();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsGoogleLoading(false);
        }
    }

    // through cred
    async function onSubmit(values: SignInFormData) {
        setIsSubmitting(true);
        try {
            const res = await signInCred(values);

            if (res.success) {
                toast.success("Login successfull");
                router.push("/dashboard");
            } else {
                toast.error(res.message);
            }

        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex">

            {/* LEFT 60% */}
            <div className="relative w-full lg:w-3/5 flex items-center justify-center px-8">
                {/* LOGO */}
                <div className="absolute top-0 left-4 flex items-center">
                    <Logo />
                </div>

                {/* FORM */}
                <div className="w-full max-w-md space-y-6">
                    <div>
                        <h1 className="text-3xl font-semibold font-mono">
                            Log In
                        </h1>
                    </div>

                    <p className="text-md text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            href="/sign-up"
                            className="font-medium text-primary hover:underline"
                        >
                            Sign Up
                        </Link>
                    </p>

                    <Button
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="w-full h-10 gap-4 !border !border-blue-600"
                        disabled={isGoogleLoading || isSubmitting}
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait
                            </>
                        ) : (
                            <>
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                                Continue with Google
                            </>
                        )}
                    </Button>

                    <div className="relative py-2">
                        <div className="border-t" />
                        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                            OR
                        </span>
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
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
                                                    className="pl-10 h-10 border border-black"
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Password"
                                                {...field}
                                                className="h-10 border border-black"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bug 4 fix: Changed <p> to a real Link */}
                            <Link
                                href="/forgot-password"
                                className="text-sm text-right hover:underline block text-right"
                            >
                                Forgot Password?
                            </Link>

                            <Button
                                type="submit"
                                disabled={isSubmitting || isGoogleLoading}
                                className="w-full h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Please wait
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight />
                                        Log In
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>

            {/* RIGHT 40% */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-800 via-emerald-600 to-blue-300 items-center justify-center p-10">
                <div className="max-w-md text-white flex flex-col items-center text-center">

                    <Image
                        src="/images/me_pic.jpg"
                        alt="Mrinal Singh"
                        width={180}
                        height={180}
                        className="rounded-full border-4 border-white shadow-lg object-cover mb-8"
                    />

                    <p className="text-3xl font-medium leading-relaxed">
                        &quot;The AI interviews felt surprisingly real.
                        By the time I faced actual interviews,
                        I already knew exactly how to structure my
                        answers and handle pressure.&quot;
                    </p>

                    <div className="mt-8">
                        <p className="font-semibold text-lg">
                            Mrinal Singh
                        </p>

                        <p className="text-green-100">
                            Software Engineering Candidate
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}