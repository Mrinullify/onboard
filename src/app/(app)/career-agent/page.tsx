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
    ArrowRight,
    HelpCircle,
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
        <blockquote className="my-5 border-l-4 border-primary/50 bg-muted/30 px-4 py-3 rounded-r-lg text-sm italic text-muted-foreground">
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
        <thead className="bg-muted/60">
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
        <pre className="my-5 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-sm leading-6">
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
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
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

                {/* Header */}
                <div className="rounded-3xl border bg-gradient-to-br from-indigo-950/60 via-background to-purple-950/40 p-8 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-indigo-500/20 p-3 border border-indigo-500/30">
                            <Bot className="h-7 w-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">AI Career & Market Agent</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                RAG-powered guidance comparing your resume history & AI feedback against live industry requirements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Query Form */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Target Role (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Data Engineer, Full Stack Developer, DevOps Engineer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Your Career / Skill Question
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Ask anything about your resume, missing skills, career progression, or market demand..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full rounded-xl border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        {/* Suggested Questions */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                Suggested Questions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => handleSelectPrompt(q)}
                                        className="cursor-pointer rounded-full border bg-muted/50 hover:bg-muted px-3.5 py-1.5 text-xs text-left transition"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center flex-wrap gap-3">
                            <Link
                                href="/resume"
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                View or Update Resume
                            </Link>

                            <button
                                type="submit"
                                disabled={isLoading || !question.trim()}
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Analyzing Multi-Source RAG...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Ask Career Agent
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sources Used Badge Bar */}
                {sources && (
                    <div className="rounded-2xl border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2.5 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Knowledge Sources Utilized for this Answer:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${sources.currentResume
                                    ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "opacity-40"
                                    }`}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Current Resume {sources.currentResume ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${sources.resumeHistory
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "opacity-40"
                                    }`}
                            >
                                <History className="h-3.5 w-3.5" />
                                Resume History {sources.resumeHistory ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${sources.previousFeedback
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                    : "opacity-40"
                                    }`}
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                AI Evaluation History {sources.previousFeedback ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${sources.marketData
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "opacity-40"
                                    }`}
                            >
                                <Database className="h-3.5 w-3.5" />
                                Persistent Market RAG {sources.marketData ? "✓" : ""}
                            </span>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${sources.liveWebSearch
                                    ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                    : "opacity-40"
                                    }`}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                Live Market Search {sources.liveWebSearch ? "✓" : ""}
                            </span>
                        </div>
                    </div>
                )}

                {/* Answer Card */}
                {answer && (
                    <div className="rounded-3xl border bg-card p-8 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-3">
                        <div className="flex items-center gap-2 text-primary font-semibold text-lg border-b pb-4">
                            <Sparkles className="h-5 w-5" />
                            Personalized Career Intelligence Response
                        </div>

                        <div className="max-w-none">
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
