import { MarketSearchParams, MarketSearchResult } from "./types";

export interface MarketSearchProvider {
    search(params: MarketSearchParams): Promise<MarketSearchResult[]>;
}

/**
 * Serper.dev Google Search API provider
 */
export class SerperSearchProvider implements MarketSearchProvider {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.SERPER_API_KEY || "";
    }

    async search({ role, query, limit = 4 }: MarketSearchParams): Promise<MarketSearchResult[]> {
        if (!this.apiKey) {
            throw new Error("SERPER_API_KEY not configured");
        }

        const searchQuery = `${role} ${query} job requirements skills in demand ${new Date().getFullYear()}`;

        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": this.apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: searchQuery,
                num: limit,
            }),
        });

        if (!response.ok) {
            throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const organic = data.organic || [];

        return organic.slice(0, limit).map((item: any) => ({
            title: item.title || "",
            snippet: item.snippet || "",
            link: item.link || "",
            source: "Serper Web Search",
            collectedAt: new Date().toISOString(),
        }));
    }
}

/**
 * Testable Mock Search Provider with realistic market data
 */
export class MockSearchProvider implements MarketSearchProvider {
    async search({ role, query, limit = 3 }: MarketSearchParams): Promise<MarketSearchResult[]> {
        const lowerRole = role.toLowerCase();
        const now = new Date().toISOString();

        // High quality curated market insights for common roles
        if (lowerRole.includes("data engineer")) {
            return [
                {
                    title: "Top In-Demand Data Engineering Skills & Technologies (Current Market)",
                    snippet: "Employers actively look for Apache Spark / PySpark, Apache Kafka, Snowflake / Databricks, dbt (data build tool), Airflow for orchestration, and strong SQL + Python. Cloud experience with AWS (Glue, Athena, Redshift) or GCP (BigQuery) is mandatory in >85% of listings.",
                    source: "Live Market Index (Mock)",
                    collectedAt: now,
                },
                {
                    title: "Emerging Data Engineering Trends & Architecture Expectations",
                    snippet: "Modern Data Stack emphasizes Data Observability (Monte Carlo, Great Expectations), Iceberg / Delta Lake table formats, streaming data with Flink/Kafka, and CI/CD for data pipelines using Terraform.",
                    source: "Tech Hiring Report (Mock)",
                    collectedAt: now,
                },
            ].slice(0, limit);
        } else if (lowerRole.includes("frontend") || lowerRole.includes("react")) {
            return [
                {
                    title: "Frontend Engineering Requirements (Current Market)",
                    snippet: "Key demands: React 19 / Next.js (App Router, Server Actions), TypeScript strict mode, Tailwind CSS, performance optimization (Core Web Vitals, SSR/SSG), state management (Zustand/TanStack Query), and end-to-end testing with Playwright.",
                    source: "Live Market Index (Mock)",
                    collectedAt: now,
                },
                {
                    title: "Modern Frontend Stack Expectations",
                    snippet: "Companies prioritize micro-frontends, accessibility (a11y), GraphQL / REST integration, Edge computing, and AI-assisted UI integration (Vercel AI SDK, streaming responses).",
                    source: "Tech Hiring Report (Mock)",
                    collectedAt: now,
                },
            ].slice(0, limit);
        } else if (lowerRole.includes("backend") || lowerRole.includes("full stack") || lowerRole.includes("software engineer")) {
            return [
                {
                    title: "Software Engineer & Backend In-Demand Stack",
                    snippet: "Core requirements: Distributed systems design, PostgreSQL / Redis / Vector databases, Docker & Kubernetes containerization, RESTful & gRPC APIs, Go / Node.js / Python / Java, and event-driven architecture.",
                    source: "Live Market Index (Mock)",
                    collectedAt: now,
                },
                {
                    title: "Cloud & Reliability Expectations",
                    snippet: "High emphasis on AWS/GCP services, CI/CD automation with GitHub Actions, system observability (OpenTelemetry, Prometheus, Datadog), and AI/LLM integration patterns (RAG, embedding workflows).",
                    source: "Tech Hiring Report (Mock)",
                    collectedAt: now,
                },
            ].slice(0, limit);
        }

        // Generic tech fallback
        return [
            {
                title: `${role} - Current Market Demand & Skill Requirements`,
                snippet: `Current job postings for ${role} prioritize strong foundations in programming, problem-solving, modern cloud platforms (AWS/GCP/Azure), containerization (Docker), collaborative agile workflows, and domain-specific frameworks.`,
                source: "Live Market Index (Mock)",
                collectedAt: now,
            },
        ];
    }
}

/**
 * Universal Market Search entrypoint with automatic provider selection and fallback
 */
export async function searchMarket(params: MarketSearchParams): Promise<MarketSearchResult[]> {
    const hasSerperKey = Boolean(process.env.SERPER_API_KEY && process.env.SERPER_API_KEY.trim() !== "");

    if (hasSerperKey) {
        try {
            const provider = new SerperSearchProvider();
            const results = await provider.search(params);
            if (results && results.length > 0) {
                return results;
            }
        } catch (err) {
            console.warn("[MarketSearch] Serper provider failed, falling back to mock provider:", err);
        }
    }

    // Fallback to MockSearchProvider
    const mockProvider = new MockSearchProvider();
    return await mockProvider.search(params);
}
