"use client";

import { useEffect, useState } from "react";
import {
    Upload,
    CheckCircle2,
    XCircle,
    Sparkles,
} from "lucide-react";
import { ResumeEmptyState } from "@/components/resume/emptyState";
import ResumeAnalyzingLoader from "@/components/resume/analysisLoader";
import { ResumeHealthSummary } from "@/components/resume/resumeHealthSummary";
import { OverallScoreHero } from "@/components/resume/scoreHero";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type ResumeAnalysis = {
    score: number;
    atsScore: number;
    grammarScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    missingKeywords: string[];
};

const mockAnalysis: ResumeAnalysis = {
    score: 72,
    atsScore: 68,
    grammarScore: 85,

    strengths: [
        "Clear project descriptions",
        "Good technical stack usage",
        "Strong internship experience",
    ],

    weaknesses: [
        "Lacks quantified achievements",
        "Missing ATS keywords",
        "Weak summary section",
    ],

    suggestions: [
        "Add measurable achievements",
        "Improve professional summary",
        "Include missing keywords from job descriptions",
    ],

    missingKeywords: [
        "React",
        "Node.js",
        "REST API",
    ],
};

// SCORE STYLES
function getScoreStyles(score: number) {
    if (score <= 30) {
        return {
            text: "text-red-500",
            border: "border-red-500/60",
            bg: "bg-red-500/15",
            progress: "bg-red-500",
        };
    }

    if (score <= 55) {
        return {
            text: "text-yellow-500",
            border: "border-yellow-500/60",
            bg: "bg-yellow-500/15",
            progress: "bg-yellow-500",
        };
    }

    return {
        text: "text-green-500",
        border: "border-green-500/60",
        bg: "bg-green-500/15",
        progress: "bg-green-500",
    };
}

export default function ResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);


    useEffect(() => {
        setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysis(mockAnalysis);
        }, 2000);
    }, []);

    const scoreStyles = getScoreStyles(mockAnalysis.score);
    const atsScoreStyles = getScoreStyles(mockAnalysis.atsScore);
    const grammarScoreStyles = getScoreStyles(mockAnalysis.grammarScore);

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-6xl space-y-6">

                {/* Breadcrumbs */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Resume Analyzer</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">
                        Resume Analyzer
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Upload your resume and get AI-powered feedback,
                        ATS analysis and improvement suggestions.
                    </p>
                </div>

                {
                    isAnalyzing ? (
                        <ResumeAnalyzingLoader />
                    ) : !analysis ? (
                        <>
                            {/* Upload Card */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-10 transition-colors hover:bg-primary/10 hover:border-primary/40">

                                    <Upload className="h-10 w-10 text-primary" />

                                    <h2 className="mt-4 text-lg font-medium">
                                        Upload Resume
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        PDF or DOCX supported
                                    </p>

                                    <input
                                        type="file"
                                        id="resume-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />

                                    <label
                                        htmlFor="resume-upload"
                                        className="mt-6 cursor-pointer rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:opacity-90 active:scale-95"
                                    >
                                        Choose File
                                    </label>

                                    {file && (
                                        <div className="mt-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {file.name}
                                            </div>
                                            <button
                                                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50 active:scale-95 flex items-center gap-2"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                Analyze Resume
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RESUME EMPTY STATE */}
                            <div className="opacity-80">
                                <ResumeEmptyState />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* OVERALL SCORE HERO */}
                            <OverallScoreHero />

                            {/* RESUME HEALTH SUMMARY */}
                            <ResumeHealthSummary />

                            {/* Score Cards */}
                            <div className="grid gap-4 md:grid-cols-3">

                                <div className={`rounded-xl border p-5 ${scoreStyles.bg} ${scoreStyles.border} `}>
                                    <p className="text-sm text-muted-foreground">
                                        Overall Score
                                    </p>

                                    <h3 className={`mt-2 text-4xl font-bold ${scoreStyles.text} `}>
                                        {mockAnalysis.score}
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        out of 100
                                    </p>


                                    {/* PROGRESS BAR */}
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${scoreStyles.progress}`}
                                            style={{
                                                width: `${mockAnalysis.score}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className={`rounded-xl border p-5 ${atsScoreStyles.bg} ${atsScoreStyles.border} `}>
                                    <p className="text-sm text-muted-foreground">
                                        ATS Score
                                    </p>

                                    <h3 className={`mt-2 text-4xl font-bold ${atsScoreStyles.text} `}>
                                        {mockAnalysis.atsScore}
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        ATS compatibility
                                    </p>

                                    {/* PROGRESS BAR */}
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${atsScoreStyles.progress}`}
                                            style={{
                                                width: `${mockAnalysis.atsScore}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* GRAMMAR SCORE */}
                                <div className={`rounded-xl border p-5 ${grammarScoreStyles.bg} ${grammarScoreStyles.border} `}>
                                    <p className="text-sm text-muted-foreground">
                                        Grammar Score
                                    </p>

                                    <h3 className={`mt-2 text-4xl font-bold ${grammarScoreStyles.text} `}>
                                        {mockAnalysis.grammarScore}
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        Spelling & Grammar
                                    </p>

                                    {/* PROGRESS BAR */}
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${grammarScoreStyles.progress}`}
                                            style={{
                                                width: `${mockAnalysis.grammarScore}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Strengths + Weaknesses */}
                            <div className="grid gap-4 md:grid-cols-2">

                                {/* Strengths */}
                                <div className="rounded-xl border border-green-500/20 bg-green-600/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <h2 className="font-semibold">
                                                Strengths
                                            </h2>
                                        </div>

                                        <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                                            {mockAnalysis.strengths.length}
                                        </span>
                                    </div>

                                    <ul className="space-y-3">
                                        {mockAnalysis.strengths.map((strength) => (
                                            <li
                                                key={strength}
                                                className="
                                                            flex
                                                            items-center
                                                            gap-3
                                                            rounded-lg
                                                            bg-background/60
                                                            p-3
                                                            transition
                                                            hover:bg-background
                                                        "
                                            >
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />

                                                <span className="text-sm">
                                                    {strength}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                </div>

                                {/* Weaknesses */}
                                <div className="rounded-xl border border-red-500/20 bg-red-500/15 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-5 w-5 text-red-500" />
                                            <h2 className="font-semibold">
                                                Weaknesses
                                            </h2>
                                        </div>

                                        <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                                            {mockAnalysis.weaknesses.length}
                                        </span>
                                    </div>

                                    <ul className="space-y-3">
                                        {mockAnalysis.weaknesses.map((weakness) => (
                                            <li
                                                key={weakness}
                                                className="
                    flex
                    items-center
                    gap-3
                    rounded-lg
                    bg-background/60
                    p-3
                    transition
                    hover:bg-background
                "
                                            >
                                                <XCircle className="h-4 w-4 shrink-0 text-red-500" />

                                                <span className="text-sm">
                                                    {weakness}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* MISSING KEYWORDS */}
                                <div className="rounded-xl border border-gray-300 bg-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="font-semibold">
                                            Missing Keywords
                                        </h2>

                                        <span className="rounded-full bg-gray-600/10 px-2 py-1 text-xs font-bold text-gray-500">
                                            {mockAnalysis.missingKeywords.length}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {mockAnalysis.missingKeywords.map((keyword) => (
                                            <span
                                                key={keyword}
                                                className="
                    rounded-full
                    border
                    border-gray-500/20
                    bg-gray-500/10
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-gray-700
                    transition
                    hover:scale-105
                "
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Suggestions */}
                                <div className="rounded-xl border border-blue-500/20 bg-blue-500/15 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

                                    <div className="mb-4 flex items-center justify-between">

                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-blue-500" />

                                            <h2 className="font-semibold">
                                                AI Suggestions
                                            </h2>
                                        </div>

                                        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                                            {mockAnalysis.suggestions.length}
                                        </span>

                                    </div>

                                    <ul className="space-y-3">
                                        {mockAnalysis.suggestions.map((suggestion) => (
                                            <li
                                                key={suggestion}
                                                className="
                    flex
                    gap-3
                    rounded-lg
                    bg-background/60
                    p-3
                    transition
                    hover:bg-background
                "
                                            >
                                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />

                                                <span className="text-sm">
                                                    {suggestion}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap justify-center py-6 items-center gap-10">

                                {/* Primary CTA */}
                                <button className="rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-md font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md">
                                    ✨ Improve with AI
                                </button>

                                {/* Secondary CTA */}
                                <button className="rounded-xl border border-zinc-200 bg-gray-300 px-8 py-4 text-md font-semibold text-zinc-700 transition hover:bg-zinc-200">
                                    Re-analyze Resume
                                </button>

                            </div>
                        </>
                    )
                }

            </div>
        </div>
    );
}