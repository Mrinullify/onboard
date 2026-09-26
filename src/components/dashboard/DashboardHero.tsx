"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Brain, FileText } from "lucide-react";

interface DashboardHeroProps {
    name?: string | null;
}


export default function DashboardHero({ name }: DashboardHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-accent/20 to-secondary/50 p-6 sm:p-8 md:p-10 shadow-xs">
            <div className="relative max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Candidate Dashboard</span>
                </div>

                <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-foreground capitalize">
                    Welcome back, {name || "there"} 👋
                </h1>

                <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
                    Ready to sharpen your interview and technical readiness today?
                    Analyze your resume with targeted ATS feedback or launch a realistic AI-driven assessment.
                </p>
            </div>

            {/* Action Cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {/* Resume Action */}
                <Link href="/resume" className="group block">
                    <div className="flex items-start gap-4 rounded-xl border border-border/80 bg-card/90 p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <FileText className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                Analyze Resume
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-snug">
                                ATS keyword matching, impact metrics, strengths, and actionable feedback.
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Assessment Action */}
                <Link href="/assessment" className="group block">
                    <div className="flex items-start gap-4 rounded-xl border border-border/80 bg-card/90 p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Brain className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                Start Assessment
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-snug">
                                Real-time coding, technical MCQs, and scenario questions with AI evaluation.
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
}