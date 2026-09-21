import { prisma } from "@/lib/prisma";
import { getMarketContext } from "./market-knowledge";
import { searchMarket } from "./market-search";
import { CareerContext, SourceAttribution } from "./types";
import { searchVectors } from "./vector-store";

export interface BuildContextParams {
    userId: string;
    question: string;
    targetRole?: string;
    resumeId?: string;
}

export async function buildCareerContext(params: BuildContextParams): Promise<CareerContext> {
    const { userId, question, targetRole, resumeId } = params;

    const sources: SourceAttribution = {
        currentResume: false,
        resumeHistory: false,
        previousFeedback: false,
        marketData: false,
        liveWebSearch: false,
    };

    let currentResumeContext = "";
    let resumeHistoryContext = "";
    let previousFeedbackContext = "";
    let persistentMarketContext = "";
    let liveWebContext = "";

    // 1. RETRIEVE CURRENT RESUME
    let activeResumeId = resumeId;
    let activeRole = targetRole;

    try {
        const currentResume = activeResumeId
            ? await prisma.resume.findFirst({
                where: { id: activeResumeId, userId },
                include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
            })
            : await prisma.resume.findFirst({
                where: { userId },
                orderBy: { version: "desc" },
                include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
            });

        if (currentResume) {
            activeResumeId = currentResume.id;
            if (!activeRole && currentResume.targetRole) {
                activeRole = currentResume.targetRole;
            }

            // Semantic retrieval of specific sections relevant to question
            const relevantChunks = await searchVectors({
                query: question,
                userId,
                sourceType: "resume",
                resumeId: currentResume.id,
                limit: 4,
            });

            const chunkText = relevantChunks.length > 0
                ? relevantChunks.map((c) => `[${c.metadata.section || "Section"}]: ${c.text}`).join("\n\n")
                : currentResume.extractedText.slice(0, 3000);

            currentResumeContext = `
File: ${currentResume.fileName} (v${currentResume.version})
Target Role: ${currentResume.targetRole || activeRole || "Not specified"}
Uploaded: ${currentResume.createdAt.toLocaleDateString()}

Resume Highlights / Content:
${chunkText}
`.trim();

            sources.currentResume = true;
        }
    } catch (err) {
        console.warn("[ContextBuilder] Error retrieving current resume:", err);
    }

    // 2. RETRIEVE RESUME HISTORY
    try {
        const historyResumes = await prisma.resume.findMany({
            where: {
                userId,
                ...(activeResumeId ? { id: { not: activeResumeId } } : {}),
            },
            orderBy: { version: "desc" },
            take: 3,
        });

        if (historyResumes.length > 0) {
            const historySummaries = historyResumes.map((r) => {
                const preview = r.extractedText.slice(0, 500).replace(/\n+/g, " ");
                return `- Version ${r.version} (${r.fileName}, uploaded ${r.createdAt.toLocaleDateString()}): Target Role: ${r.targetRole || "General"}. Preview: "${preview}..."`;
            });

            resumeHistoryContext = `
Previous Resume Versions (${historyResumes.length} older version(s) found):
${historySummaries.join("\n")}
`.trim();

            sources.resumeHistory = true;
        }
    } catch (err) {
        console.warn("[ContextBuilder] Error retrieving resume history:", err);
    }

    // 3. RETRIEVE PREVIOUS FEEDBACK
    try {
        const pastAnalyses = await prisma.resumeAnalysis.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
        });

        if (pastAnalyses.length > 0) {
            const feedbackEntries = pastAnalyses.map((a, idx) => {
                const strengths = Array.isArray(a.strengths) ? (a.strengths as string[]).join(", ") : "";
                const weaknesses = Array.isArray(a.weaknesses) ? (a.weaknesses as string[]).join(", ") : "";
                const missing = Array.isArray(a.missingSkills) ? (a.missingSkills as string[]).join(", ") : "";
                const recs = Array.isArray(a.recommendations) ? (a.recommendations as string[]).join("; ") : "";

                return `Analysis #${idx + 1} (Score: ${a.score || "N/A"}/100, ATS: ${a.atsScore || "N/A"}%):
- Strengths: ${strengths || "N/A"}
- Weaknesses: ${weaknesses || "N/A"}
- Missing Skills: ${missing || "None noted"}
- Recommendations: ${recs || "None noted"}
- AI Summary: ${a.feedback || "None"}`;
            });

            previousFeedbackContext = feedbackEntries.join("\n\n---\n\n");
            sources.previousFeedback = true;
        }
    } catch (err) {
        console.warn("[ContextBuilder] Error retrieving previous feedback:", err);
    }

    // 4. RETRIEVE PERSISTENT MARKET KNOWLEDGE
    try {
        const marketRole = activeRole || targetRole || "Software Engineer";
        const marketData = await getMarketContext(question, marketRole);

        if (marketData && marketData.trim().length > 0) {
            persistentMarketContext = marketData;
            sources.marketData = true;
        }
    } catch (err) {
        console.warn("[ContextBuilder] Error retrieving persistent market context:", err);
    }

    // 5. LIVE WEB MARKET SEARCH
    try {
        const searchRole = activeRole || targetRole || "Software Engineer";
        const webResults = await searchMarket({
            role: searchRole,
            query: question,
            limit: 3,
        });

        if (webResults && webResults.length > 0) {
            const formattedWeb = webResults.map((item, idx) => {
                return `[Result #${idx + 1}] ${item.title} (${item.source || "Web"}):
${item.snippet}`;
            });

            liveWebContext = formattedWeb.join("\n\n");
            sources.liveWebSearch = true;
        }
    } catch (err) {
        console.warn("[ContextBuilder] Error performing live market search:", err);
    }

    return {
        currentResumeContext: currentResumeContext || "No current resume found. Advice will be based on general market requirements.",
        resumeHistoryContext: resumeHistoryContext || "No previous resume history available.",
        previousFeedbackContext: previousFeedbackContext || "No previous AI evaluation feedback available.",
        persistentMarketContext: persistentMarketContext || "Standard software engineering industry standards apply.",
        liveWebContext: liveWebContext || "Live web market data unavailable for this query.",
        sources,
    };
}
