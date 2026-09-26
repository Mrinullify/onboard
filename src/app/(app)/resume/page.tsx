"use client";

import { useEffect, useState } from "react";
import {
    Upload,
    CheckCircle2,
    XCircle,
    Sparkles,
    FileText,
    History,
    RefreshCw,
    Bot,
    ArrowRight,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
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
import { toast } from "sonner";

type ResumeRecord = {
    id: string;
    fileName: string;
    version: number;
    targetRole?: string | null;
    createdAt: string;
};

type ResumeAnalysisData = {
    id?: string;
    score: number;
    atsScore: number;
    grammarScore: number;
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    recommendations: string[];
    feedback: string;
};

function getScoreStyles(score: number) {
    if (score <= 50) {
        return {
            text: "text-red-500",
            border: "border-red-500/60",
            bg: "bg-red-500/15",
            progress: "bg-red-500",
        };
    }
    if (score <= 74) {
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
    const [targetRole, setTargetRole] = useState("");
    const [currentResume, setCurrentResume] = useState<ResumeRecord | null>(null);
    const [analysis, setAnalysis] = useState<ResumeAnalysisData | null>(null);
    const [history, setHistory] = useState<ResumeRecord[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);

    // Fetch initial latest resume and history
    useEffect(() => {
        async function fetchLatest() {
            try {
                const res = await fetch("/api/resume/latest");
                if (res.ok) {
                    const data = await res.json();
                    if (data.resume) {
                        setCurrentResume(data.resume);
                        if (data.analysis) {
                            setAnalysis({
                                score: data.analysis.score ?? 75,
                                atsScore: data.analysis.atsScore ?? 70,
                                grammarScore: data.analysis.grammarScore ?? 85,
                                strengths: (data.analysis.strengths as string[]) || [],
                                weaknesses: (data.analysis.weaknesses as string[]) || [],
                                missingSkills: (data.analysis.missingSkills as string[]) || [],
                                recommendations: (data.analysis.recommendations as string[]) || [],
                                feedback: data.analysis.feedback || "",
                            });
                        }
                    }
                }

                // Fetch history
                const histRes = await fetch("/api/resume/history");
                if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.resumes) {
                        setHistory(histData.resumes);
                    }
                }
            } catch (err) {
                console.error("Failed to load initial resume:", err);
            } finally {
                setIsInitialLoading(false);
            }
        }
        fetchLatest();
    }, []);

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please choose a file to upload.");
            return;
        }

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("file", file);
        if (targetRole.trim()) {
            formData.append("targetRole", targetRole.trim());
        }

        try {
            const res = await fetch("/api/resume/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Upload failed");
            }

            setCurrentResume(data.resume);
            setAnalysis({
                score: data.analysis.score ?? 71,
                atsScore: data.analysis.atsScore ?? 72,
                grammarScore: data.analysis.grammarScore ?? 73,
                strengths: (data.analysis.strengths as string[]) || [],
                weaknesses: (data.analysis.weaknesses as string[]) || [],
                missingSkills: (data.analysis.missingSkills as string[]) || [],
                recommendations: (data.analysis.recommendations as string[]) || [],
                feedback: data.analysis.feedback || "",
            });

            toast.success(`Resume uploaded & analyzed successfully (v${data.resume.version})!`);
            setShowUploadForm(false);
            setFile(null);

            // Refresh history
            const histRes = await fetch("/api/resume/history");
            if (histRes.ok) {
                const histData = await histRes.json();
                if (histData.resumes) setHistory(histData.resumes);
            }
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Failed to analyze resume. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isInitialLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading resume workspace...</p>
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        return <ResumeAnalyzingLoader />;
    }

    const score = analysis?.score ?? 0;
    const atsScore = analysis?.atsScore ?? 0;
    const grammarScore = analysis?.grammarScore ?? 0;
    const scoreStyles = getScoreStyles(score);
    const atsScoreStyles = getScoreStyles(atsScore);
    const grammarScoreStyles = getScoreStyles(grammarScore);

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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Resume Analyzer</h1>
                            {currentResume && (
                                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                    v{currentResume.version}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            Upload your resume to get automated ATS scoring, structure checks, and actionable role feedback.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentResume && (
                            <>
                                <button
                                    onClick={() => setShowUploadForm(!showUploadForm)}
                                    className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-sm font-medium transition hover:bg-secondary hover:text-foreground shadow-2xs"
                                >
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span>{showUploadForm ? "Hide Upload" : "Upload New Version"}</span>
                                </button>

                                <Link
                                    href="/career-agent"
                                    className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-2xs transition hover:bg-primary/90"
                                >
                                    <Bot className="h-4 w-4" />
                                    <span>Ask Career Agent</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Upload Form (Shown when no resume exists OR when user clicks Upload New Version) */}
                {(!currentResume || showUploadForm) && (
                    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs transition-all">
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/90 bg-secondary/20 p-8 text-center transition-colors hover:bg-secondary/40 hover:border-primary/40">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                <Upload className="h-6 w-6" />
                            </div>

                            <h2 className="text-base font-semibold text-foreground">
                                {currentResume ? "Upload Next Resume Version" : "Upload Your Resume"}
                            </h2>

                            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                PDF, DOCX, or TXT format supported (maximum file size 10MB)
                            </p>

                            <div className="mt-5 w-full max-w-md text-left">
                                <label className="text-xs font-medium text-foreground block mb-1.5">
                                    Target Role (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Full Stack Engineer, Cloud Architect, Backend Lead"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <input
                                type="file"
                                id="resume-upload"
                                accept=".pdf,.docx,.doc,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setFile(e.target.files[0]);
                                    }
                                }}
                            />

                            <label
                                htmlFor="resume-upload"
                                className="mt-5 cursor-pointer rounded-lg border border-border/80 bg-card px-4 py-2 text-xs sm:text-sm font-medium text-foreground shadow-2xs transition hover:bg-secondary"
                            >
                                Browse Files
                            </label>

                            {file && (
                                <div className="mt-5 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        className="rounded-lg bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 flex items-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        <span>Analyze Resume</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Analysis Results View */}
                {analysis && currentResume && (
                    <>
                        {/* HERO SECTION */}
                        <OverallScoreHero
                            score={score}
                            atsScore={atsScore}
                            strengthsCount={analysis.strengths.length}
                            weaknessesCount={analysis.weaknesses.length}
                            feedback={analysis.feedback}
                        />

                        {/* RESUME HEALTH SUMMARY */}
                        <ResumeHealthSummary
                            score={score}
                            targetRole={currentResume.targetRole || targetRole}
                            feedback={analysis.feedback}
                            topRecommendation={analysis.recommendations[0]}
                            topOpportunity={analysis.weaknesses[0]}
                        />

                        {/* Score Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                                <p className="text-xs font-medium text-muted-foreground">Overall Resume Score</p>
                                <h3 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                    {Math.round(score)}
                                    <span className="text-sm font-normal text-muted-foreground"> / 100</span>
                                </h3>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                                <p className="text-xs font-medium text-muted-foreground">ATS Compatibility</p>
                                <h3 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                    {Math.round(atsScore)}%
                                </h3>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                                        style={{ width: `${atsScore}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                                <p className="text-xs font-medium text-muted-foreground">Grammar & Polish</p>
                                <h3 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                                    {Math.round(grammarScore)}%
                                </h3>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                                        style={{ width: `${grammarScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Strengths */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <h2 className="text-sm font-semibold text-foreground">Identified Strengths</h2>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        {analysis.strengths.length}
                                    </span>
                                </div>
                                <ul className="space-y-2.5">
                                    {analysis.strengths.map((strength, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2.5 rounded-lg bg-secondary/30 p-3 text-xs sm:text-sm text-foreground/90"
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <h2 className="text-sm font-semibold text-foreground">Areas for Improvement</h2>
                                    </div>
                                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                        {analysis.weaknesses.length}
                                    </span>
                                </div>
                                <ul className="space-y-2.5">
                                    {analysis.weaknesses.map((weakness, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2.5 rounded-lg bg-secondary/30 p-3 text-xs sm:text-sm text-foreground/90"
                                        >
                                            <XCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                            <span>{weakness}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Missing Keywords & AI Suggestions */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* MISSING KEYWORDS */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-primary" />
                                        <h2 className="text-sm font-semibold text-foreground">Missing In-Demand Keywords</h2>
                                    </div>
                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                        {analysis.missingSkills.length}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingSkills.length > 0 ? (
                                        analysis.missingSkills.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground"
                                            >
                                                + {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            No critical skill gaps detected for this role.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h2 className="text-sm font-semibold text-foreground">Actionable Recommendations</h2>
                                    </div>
                                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                        {analysis.recommendations.length}
                                    </span>
                                </div>
                                <ul className="space-y-2.5">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2.5 rounded-lg bg-secondary/30 p-3 text-xs sm:text-sm text-foreground/90"
                                        >
                                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Resume Version History Section */}
                        {history.length > 1 && (
                            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    <h2 className="text-sm font-semibold text-foreground">Resume Version History</h2>
                                </div>
                                <div className="divide-y divide-border/60">
                                    {history.map((h) => (
                                        <div
                                            key={h.id}
                                            className="py-3 flex items-center justify-between flex-wrap gap-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="font-medium text-xs sm:text-sm text-foreground">
                                                        {h.fileName}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            (v{h.version})
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Uploaded {new Date(h.createdAt).toLocaleDateString()} • Target: {h.targetRole || "General"}
                                                    </p>
                                                </div>
                                            </div>
                                            {h.id === currentResume.id ? (
                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                                    Active Version
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Previous Version
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="flex flex-wrap justify-center py-6 items-center gap-4">
                            <Link
                                href="/career-agent"
                                className="rounded-lg bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Bot className="h-4 w-4" />
                                <span>Ask Career Agent Questions</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <button
                                onClick={() => setShowUploadForm(true)}
                                className="rounded-lg border border-border/80 bg-card px-6 py-2.5 text-xs sm:text-sm font-medium text-foreground transition hover:bg-secondary shadow-2xs"
                            >
                                Upload Newer Version
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}