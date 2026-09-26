"use client";

import { useState } from "react";
import {
    Bot,
    Send,
    Sparkles,
    Globe,
    FileText,
    History,
    MessageSquare,
    Database,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SourceAttribution = {
    currentResume: boolean;
    resumeHistory: boolean;
    previousFeedback: boolean;
    marketData: boolean;
    liveWebSearch: boolean;
};

const SUGGESTED_QUESTIONS = [
    "What skills am I missing for Data Engineer jobs right now?",
    "How does my experience compare to market expectations for Senior Frontend roles?",
    "What technologies should I learn next to increase my compensation?",
    "What specific projects should I build to bridge my resume gaps?",
];

const markdownComponents = {
    h1: ({ children }: any) => (
        <h1 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-foreground first:mt-0">
            {children}
        </h1>
    ),

    h2: ({ children }: any) => (
        <h2 className="mt-8 mb-3 border-b border-border/50 pb-2 text-xl font-semibold tracking-tight text-foreground">
            {children}
        </h2>
    ),

    h3: ({ children }: any) => (
        <h3 className="mt-6 mb-2 text-lg font-semibold text-foreground">
            {children}
        </h3>
    ),

    p: ({ children }: any) => (
        <p className="my-3 text-sm leading-7 text-muted-foreground">
            {children}
        </p>
    ),

    ul: ({ children }: any) => (
        <ul className="my-4 ml-5 list-disc space-y-2 text-sm leading-6 text-muted-foreground">
            {children}
        </ul>
    ),

    ol: ({ children }: any) => (
        <ol className="my-4 ml-5 list-decimal space-y-2 text-sm leading-6 text-muted-foreground">
            {children}
        </ol>
    ),

    li: ({ children }: any) => (
        <li className="pl-1">
            {children}
        </li>
    ),

    strong: ({ children }: any) => (
        <strong className="font-semibold text-foreground">
            {children}
        </strong>
    ),

    em: ({ children }: any) => (
        <em className="text-foreground/80">
            {children}
        </em>
    ),

    hr: () => (
        <hr className="my-8 border-border/60" />
    ),

    blockquote: ({ children }: any) => (
        <blockquote className="my-5 border-l-4 border-primary/50 bg-accent/30 px-4 py-3 rounded-r-lg text-sm italic text-muted-foreground">
            {children}
        </blockquote>
    ),

    // TABLE
    table: ({ children }: any) => (
        <div className="my-6 overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[700px] border-collapse text-sm">
                {children}
            </table>
        </div>
    ),

    thead: ({ children }: any) => (
        <thead className="bg-secondary/60">
            {children}
        </thead>
    ),

    tbody: ({ children }: any) => (
        <tbody className="divide-y divide-border/50">
            {children}
        </tbody>
    ),

    tr: ({ children }: any) => (
        <tr className="transition-colors hover:bg-muted/30">
            {children}
        </tr>
    ),

    th: ({ children }: any) => (
        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground">
            {children}
        </th>
    ),

    td: ({ children }: any) => (
        <td className="px-4 py-4 align-top text-sm leading-6 text-muted-foreground">
            {children}
        </td>
    ),

    // CODE
    pre: ({ children }: any) => (
        <pre className="my-5 overflow-x-auto rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm leading-6">
            {children}
        </pre>
    ),

    code: ({ children, className }: any) => {
        const isCodeBlock = className?.includes("language-");

        if (isCodeBlock) {
            return (
                <code className="font-mono text-sm">
                    {children}
                </code>
            );
        }

        return (
            <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
            </code>
        );
    },

    a: ({ href, children }: any) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
            {children}
        </a>
    ),
};

export default function CareerAgentPage() {
    const [question, setQuestion] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [answer, setAnswer] = useState<string | null>(null);
    const [sources, setSources] = useState<SourceAttribution | null>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!question.trim()) {
            toast.error("Please enter a question.");
            return;
        }

        setIsLoading(true);
        setAnswer(null);
        setSources(null);

        try {
            const res = await fetch("/api/ai/career-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question.trim(),
                    targetRole: targetRole.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to get career advice.");
            }

            const reader = res.body?.getReader();

            if (!reader) {
                throw new Error("Response body is not readable.");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");

                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;

                    const event = JSON.parse(line);

                    if (event.type === "sources") {
                        setSources(event.sources);
                    }

                    if (event.type === "chunk") {
                        setAnswer((prev) => (prev || "") + event.content);
                    }

                    if (event.type === "error") {
                        throw new Error(event.error);
                    }

                    if (event.type === "done") {
                        toast.success("Career advice generated!");
                    }
                }
            }

            if (buffer.trim()) {
                const event = JSON.parse(buffer);

                if (event.type === "chunk") {
                    setAnswer((prev) => (prev || "") + event.content);
                }
            }

        } catch (err: any) {
            console.error("Career Agent error:", err);
            toast.error(err.message || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPrompt = (prompt: string) => {
        setQuestion(prompt);
    };

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Breadcrumbs */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/resume">Resume</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Career Intelligence Agent</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header — AI Studio Banner */}
                <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-accent/25 to-primary/8 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">AI Career &amp; Market Agent</h1>
                                <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">RAG</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                                Personalized career intelligence — compares your resume history &amp; AI evaluation metrics against live market expectations to give targeted, actionable career advice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Query Form */}
                <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-foreground block mb-1.5 uppercase tracking-wide">
                                Target Role <span className="font-normal text-muted-foreground normal-case tracking-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Data Engineer, Full Stack Developer, DevOps Engineer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground block mb-1.5 uppercase tracking-wide">
                                Your Career / Skill Question
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Ask anything about your resume, missing skills, career progression, or market demand..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full rounded-lg border border-border/80 bg-background p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-colors resize-none"
                            />
                        </div>

                        {/* Suggested Questions */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span>Suggested Inquiries:</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => handleSelectPrompt(q)}
                                        className="cursor-pointer rounded-full border border-border bg-background hover:bg-secondary hover:border-primary/30 hover:text-primary px-3 py-1 text-xs text-muted-foreground transition-colors text-left"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center flex-wrap gap-3">
                            <Link
                                href="/resume"
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                <span>View or Update Resume</span>
                            </Link>

                            <button
                                type="submit"
                                disabled={isLoading || !question.trim()}
                                className="rounded-lg bg-primary px-5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Analyzing Multi-Source RAG...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        <span>Ask Career Agent</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sources Used Badge Bar */}
                {sources && (
                    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2.5 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Knowledge Sources Utilized for this Answer:</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5 ${sources.currentResume
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "opacity-40 border-border/60 text-muted-foreground"
                                    }`}
                            >
                                <FileText className="h-3 w-3" />
                                Current Resume {sources.currentResume ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5 ${sources.resumeHistory
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "opacity-40 border-border/60 text-muted-foreground"
                                    }`}
                            >
                                <History className="h-3 w-3" />
                                Resume History {sources.resumeHistory ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5 ${sources.previousFeedback
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "opacity-40 border-border/60 text-muted-foreground"
                                    }`}
                            >
                                <MessageSquare className="h-3 w-3" />
                                AI Evaluation History {sources.previousFeedback ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5 ${sources.marketData
                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "opacity-40 border-border/60 text-muted-foreground"
                                    }`}
                            >
                                <Database className="h-3 w-3" />
                                Persistent Market RAG {sources.marketData ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5 ${sources.liveWebSearch
                                    ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                    : "opacity-40 border-border/60 text-muted-foreground"
                                    }`}
                            >
                                <Globe className="h-3 w-3" />
                                Live Market Search {sources.liveWebSearch ? "✓" : ""}
                            </span>
                        </div>
                    </div>
                )}

                {/* Answer Card */}
                {answer && (
                    <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-base sm:text-lg border-b border-border/60 pb-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span>Personalized Career Intelligence Response</span>
                        </div>

                        <div className="max-w-none text-foreground">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {answer}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
