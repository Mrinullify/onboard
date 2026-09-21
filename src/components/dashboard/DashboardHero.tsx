"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Brain, FileText } from "lucide-react";

interface DashboardHeroProps {
    name?: string | null;
}


export default function DashboardHero({ name }: DashboardHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl border">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-linear-to-r from-red-200 via-violet-200 to-green-100" />

            <div className="relative px-8 py-16 md:px-12 md:py-20">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.6,
                    }}
                    className="max-w-3xl"
                >
                    <p className="text-sm font-medium text-primary">
                        Welcome Back
                    </p>

                    <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl capitalize">
                        Hello, {name} 👋
                    </h1>

                    <p className="mt-5 text-lg text-muted-foreground">
                        Ready to sharpen your assessment skills today?
                        Analyze your resume or jump straight into a
                        realistic AI-powered assessment session.
                    </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.4,
                        delay: 0.1,
                    }}
                    className="mt-10 grid gap-5 md:grid-cols-2"
                >
                    {/* Resume */}
                    <Link href="/resume">
                        <motion.div
                            whileHover={{
                                y: -4,
                                scale: 1.01,
                            }}
                            whileTap={{
                                scale: 0.99,
                            }}
                            className="
                            group
                            rounded-2xl
                            border-4
                            border-accent
                            bg-card
                            p-8
                            transition-colors
                            hover:border-primary/40
                            "
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="
                                    rounded-xl
                                    bg-primary/10
                                    p-3
                                    "
                                >
                                    <FileText className="h-7 w-7" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Analyze Resume
                                    </h2>

                                    <p className="text-sm text-muted-foreground">
                                        ATS score, strengths,
                                        weaknesses and AI suggestions.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Assessment */}
                    <Link href="/assessment">
                        <motion.div
                            whileHover={{
                                y: -4,
                                scale: 1.01,
                            }}
                            whileTap={{
                                scale: 0.99,
                            }}
                            className="
                            group
                            rounded-2xl
                            border-4
                            border-accent
                            bg-card
                            p-8
                            transition-colors
                            hover:border-primary/40
                            "
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="
                                    rounded-xl
                                    bg-primary/10
                                    p-3
                                    "
                                >
                                    <Brain className="h-7 w-7" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Start Assessment
                                    </h2>

                                    <p className="text-sm text-muted-foreground">
                                        Practice technical and HR
                                        assessments with AI.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}