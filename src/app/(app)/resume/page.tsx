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
                            <h1 className="text-3xl font-bold">Resume Analyzer</h1>
                            {currentResume && (
                                <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                                    v{currentResume.version}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Upload your resume and get AI-powered feedback, ATS scoring, and persistent RAG insights.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentResume && (
                            <>
                                <button
                                    onClick={() => setShowUploadForm(!showUploadForm)}
                                    className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                >
                                    <Upload className="h-4 w-4" />
                                    {showUploadForm ? "Hide Upload" : "Upload New Version"}
                                </button>

                                <Link
                                    href="/career-agent"
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
                                >
                                    <Bot className="h-4 w-4" />
                                    Ask Career Agent
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Upload Form (Shown when no resume exists OR when user clicks Upload New Version) */}
                {(!currentResume || showUploadForm) && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all">
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-8 transition-colors hover:bg-primary/10 hover:border-primary/40">
                            <Upload className="h-10 w-10 text-primary" />

                            <h2 className="mt-4 text-lg font-semibold">
                                {currentResume ? "Upload Next Resume Version" : "Upload Your Resume"}
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                PDF, DOCX, or TXT supported (Max 10MB)
                            </p>

                            <div className="mt-4 w-full max-w-md">
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    Target Role (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Data Engineer, Frontend Engineer, Senior SRE"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                                className="mt-6 cursor-pointer rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
                            >
                                Choose File
                            </label>

                            {file && (
                                <div className="mt-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Analyze Resume with AI
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
                            <div className={`rounded-xl border p-5 ${scoreStyles.bg} ${scoreStyles.border}`}>
                                <p className="text-sm text-muted-foreground">Overall Score</p>
                                <h3 className={`mt-2 text-4xl font-bold ${scoreStyles.text}`}>
                                    {Math.round(score)}
                                </h3>
                                <p className="text-xs text-muted-foreground">out of 100</p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full ${scoreStyles.progress}`}
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>

                            <div className={`rounded-xl border p-5 ${atsScoreStyles.bg} ${atsScoreStyles.border}`}>
                                <p className="text-sm text-muted-foreground">ATS Score</p>
                                <h3 className={`mt-2 text-4xl font-bold ${atsScoreStyles.text}`}>
                                    {Math.round(atsScore)}%
                                </h3>
                                <p className="text-xs text-muted-foreground">ATS Keyword Compatibility</p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full ${atsScoreStyles.progress}`}
                                        style={{ width: `${atsScore}%` }}
                                    />
                                </div>
                            </div>

                            <div className={`rounded-xl border p-5 ${grammarScoreStyles.bg} ${grammarScoreStyles.border}`}>
                                <p className="text-sm text-muted-foreground">Grammar & Formatting</p>
                                <h3 className={`mt-2 text-4xl font-bold ${grammarScoreStyles.text}`}>
                                    {Math.round(grammarScore)}%
                                </h3>
                                <p className="text-xs text-muted-foreground">Readability & Polish</p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full ${grammarScoreStyles.progress}`}
                                        style={{ width: `${grammarScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Strengths */}
                            <div className="rounded-xl border border-green-500/20 bg-green-600/10 p-6 transition-all">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <h2 className="font-semibold">Strengths</h2>
                                    </div>
                                    <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                                        {analysis.strengths.length}
                                    </span>
                                </div>
                                <ul className="space-y-3">
                                    {analysis.strengths.map((strength, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 rounded-lg bg-background/80 p-3 transition"
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                                            <span className="text-sm">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 transition-all">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                        <h2 className="font-semibold">Areas for Improvement</h2>
                                    </div>
                                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                                        {analysis.weaknesses.length}
                                    </span>
                                </div>
                                <ul className="space-y-3">
                                    {analysis.weaknesses.map((weakness, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 rounded-lg bg-background/80 p-3 transition"
                                        >
                                            <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                            <span className="text-sm">{weakness}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Missing Keywords & AI Suggestions */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* MISSING KEYWORDS */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                        <h2 className="font-semibold">Missing In-Demand Keywords</h2>
                                    </div>
                                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">
                                        {analysis.missingSkills.length}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingSkills.length > 0 ? (
                                        analysis.missingSkills.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                            >
                                                + {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No critical skill gaps detected for this role.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-blue-500" />
                                        <h2 className="font-semibold">Actionable Recommendations</h2>
                                    </div>
                                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                                        {analysis.recommendations.length}
                                    </span>
                                </div>
                                <ul className="space-y-3">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 rounded-lg bg-background/80 p-3 transition"
                                        >
                                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                            <span className="text-sm">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Resume Version History Section */}
                        {history.length > 1 && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="h-5 w-5 text-muted-foreground" />
                                    <h2 className="font-semibold text-lg">Resume Version History</h2>
                                </div>
                                <div className="divide-y">
                                    {history.map((h) => (
                                        <div
                                            key={h.id}
                                            className="py-3 flex items-center justify-between flex-wrap gap-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {h.fileName}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            (v{h.version})
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Uploaded {new Date(h.createdAt).toLocaleDateString()} • Target: {h.targetRole || "General"}
                                                    </p>
                                                </div>
                                            </div>
                                            {h.id === currentResume.id ? (
                                                <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/50 px-2.5 py-1 rounded-full">
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
                        <div className="flex flex-wrap justify-center py-6 items-center gap-6">
                            <Link
                                href="/career-agent"
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3.5 text-md font-semibold text-white shadow-md transition hover:scale-105 flex items-center gap-2"
                            >
                                <Bot className="h-5 w-5" />
                                Ask Career Agent Questions
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <button
                                onClick={() => setShowUploadForm(true)}
                                className="rounded-xl border bg-card px-8 py-3.5 text-md font-semibold transition hover:bg-muted"
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