export type VectorSourceType = "resume" | "resume_feedback" | "market";

export interface VectorChunkMetadata {
    userId?: string | null;
    sourceType: VectorSourceType;
    resumeId?: string | null;
    resumeVersion?: number | null;
    section?: string | null;
    targetRole?: string | null;
    source?: string | null;
    sourceReference?: string | null;
    collectedAt?: string;
}

export interface VectorChunkPayload extends VectorChunkMetadata {
    text: string;
    createdAt: string;
}

export interface VectorSearchResult {
    id: string;
    score: number;
    text: string;
    metadata: VectorChunkMetadata;
}

export interface ResumeAnalysisResult {
    score: number;
    atsScore: number;
    grammarScore: number;
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    recommendations: string[];
    feedback: string;
}

export interface MarketSearchParams {
    role: string;
    query: string;
    limit?: number;
}

export interface MarketSearchResult {
    title: string;
    snippet: string;
    link?: string;
    source?: string;
    collectedAt?: string;
}

export interface MarketKnowledgeItem {
    role: string;
    category: string;
    title: string;
    skills: string[];
    requirements: string[];
    toolsAndFrameworks: string[];
    emergingTrends: string[];
    description: string;
    sourceReference?: string;
}

export interface SourceAttribution {
    currentResume: boolean;
    resumeHistory: boolean;
    previousFeedback: boolean;
    marketData: boolean;
    liveWebSearch: boolean;
}

export interface CareerContext {
    currentResumeContext: string;
    resumeHistoryContext: string;
    previousFeedbackContext: string;
    persistentMarketContext: string;
    liveWebContext: string;
    sources: SourceAttribution;
}

export interface CareerAgentParams {
    userId: string;
    question: string;
    targetRole?: string;
    resumeId?: string;
}

export interface CareerAgentResponse {
    success: boolean;
    answer: string;
    sources: SourceAttribution;
    targetRole?: string;
    error?: string;
}
