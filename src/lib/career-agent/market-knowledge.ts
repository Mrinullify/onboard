import { prisma } from "@/lib/prisma";
import { searchVectors, storeChunks } from "./vector-store";
import { MarketKnowledgeItem } from "./types";

export const SEED_MARKET_KNOWLEDGE: MarketKnowledgeItem[] = [
    {
        role: "Data Engineer",
        category: "Core Technologies & Architecture",
        title: "Data Engineering Industry Standard Stack",
        skills: ["SQL (Advanced)", "Python", "Apache Spark", "PySpark", "Apache Kafka", "dbt", "Apache Airflow", "Snowflake", "Databricks"],
        requirements: ["Design distributed data pipelines (ETL/ELT)", "Data warehousing and data modeling (Star/Snowflake schemas)", "Streaming and batch ingestion", "Query optimization"],
        toolsAndFrameworks: ["Airflow", "Kafka", "dbt", "Spark", "Flink", "Delta Lake", "Iceberg"],
        emergingTrends: ["Data Observability (Monte Carlo)", "Real-time stream processing", "Iceberg table formats", "Data mesh architecture"],
        description: "Data Engineers are expected to build scalable, fault-tolerant ingestion and transformation pipelines. Strong SQL and Python are non-negotiable. Modern teams require dbt for transformations and Snowflake/Databricks for analytical data lakes.",
        sourceReference: "Industry Hiring Standard 2025/2026",
    },
    {
        role: "Frontend Engineer",
        category: "Web & UI Technologies",
        title: "Modern Frontend Engineering Ecosystem",
        skills: ["React 19", "Next.js (App Router)", "TypeScript", "Tailwind CSS", "State Management (Zustand / TanStack Query)", "HTML5/CSS3 Semantic Standards", "Web Performance"],
        requirements: ["Server Components & Client Components mastery", "Core Web Vitals optimization", "Accessible UI design (ARIA)", "Automated testing (Jest, Playwright)"],
        toolsAndFrameworks: ["Next.js", "React", "Tailwind CSS", "Zustand", "TanStack Query", "Vite", "Playwright", "Storybook"],
        emergingTrends: ["AI integration into web interfaces (Vercel AI SDK, Streaming UI)", "Micro-frontends", "Edge rendering", "Tailwind v4"],
        description: "Frontend roles demand deep TypeScript proficiency, React ecosystem mastery, responsive and accessible design, and real-time interactive UI patterns. Understanding client vs server component boundaries in Next.js is essential.",
        sourceReference: "Industry Hiring Standard 2025/2026",
    },
    {
        role: "Backend Engineer",
        category: "Server, Database & Distributed Systems",
        title: "Backend & Systems Engineering Stack",
        skills: ["Node.js / TypeScript", "Go", "Python", "PostgreSQL", "Redis", "Docker", "Kubernetes", "RESTful APIs", "gRPC", "Message Queues (RabbitMQ/Kafka)"],
        requirements: ["Microservices and monolithic architectures", "Database index optimization and transaction management", "Concurrency and asynchronous programming", "Authentication & Authorization (OAuth2, JWT)"],
        toolsAndFrameworks: ["Express", "Fastify", "Prisma", "Docker", "Kubernetes", "Redis", "Kafka", "PostgreSQL"],
        emergingTrends: ["Vector databases (Qdrant, Pinecone, pgvector) for AI RAG", "Serverless & Edge functions", "Event-driven distributed systems"],
        description: "Backend engineers must master API design, relational and caching data stores, system reliability, containerization, and secure authentication workflows.",
        sourceReference: "Industry Hiring Standard 2025/2026",
    },
    {
        role: "Full Stack Engineer",
        category: "End-to-End Application Architecture",
        title: "Full Stack Web & Cloud Development",
        skills: ["TypeScript", "Next.js", "React", "Node.js", "PostgreSQL", "Prisma/Drizzle ORMs", "Tailwind CSS", "Docker", "Git/GitHub Actions"],
        requirements: ["End-to-end feature delivery from database schema to UI components", "Authentication and session management", "API integration and state handling", "Cloud deployment (Vercel, AWS, GCP)"],
        toolsAndFrameworks: ["Next.js", "React", "PostgreSQL", "Prisma", "Tailwind CSS", "Redis", "Zod"],
        emergingTrends: ["AI-native applications", "Full-stack TypeScript (tRPC, Next.js Server Actions)", "Edge computing"],
        description: "Full Stack engineers bridge UI and backend systems. High velocity product engineering, full-stack TypeScript, and modern ORMs are the standard.",
        sourceReference: "Industry Hiring Standard 2025/2026",
    },
    {
        role: "DevOps & Cloud Engineer",
        category: "Cloud Infrastructure & CI/CD",
        title: "Cloud, Infrastructure as Code & Reliability",
        skills: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "CI/CD (GitHub Actions, GitLab CI)", "Linux", "Monitoring (Prometheus, Grafana, Datadog)"],
        requirements: ["Infrastructure as Code (IaC)", "Automated deployment pipelines", "Container orchestration", "Cloud security and IAM policies"],
        toolsAndFrameworks: ["Terraform", "Kubernetes", "Helm", "Docker", "GitHub Actions", "Prometheus", "Grafana"],
        emergingTrends: ["GitOps (ArgoCD)", "Platform Engineering & Internal Developer Portals", "Cloud Cost Optimization (FinOps)"],
        description: "DevOps roles require automating cloud infrastructure, ensuring 99.99% uptime, managing secure container deployments, and building fast CI/CD pipelines.",
        sourceReference: "Industry Hiring Standard 2025/2026",
    },
];

/**
 * Seeds persistent market knowledge into DB and Vector DB if not already present
 */
export async function seedMarketKnowledge(): Promise<void> {
    try {
        const count = await prisma.vectorChunk.count({
            where: { sourceType: "market" },
        });

        if (count > 0) {
            return; // Already seeded
        }

        console.log("[MarketKnowledge] Seeding initial market knowledge vectors...");

        const chunksToStore = SEED_MARKET_KNOWLEDGE.map((item) => {
            const content = `
Role: ${item.role}
Category: ${item.category}
Overview: ${item.title}
Key Skills in Demand: ${item.skills.join(", ")}
Core Requirements: ${item.requirements.join("; ")}
Tools & Frameworks: ${item.toolsAndFrameworks.join(", ")}
Emerging Trends: ${item.emergingTrends.join(", ")}
Market Analysis: ${item.description}
`.trim();

            return {
                userId: null, // Market data is public / non-personal
                sourceType: "market" as const,
                targetRole: item.role,
                section: item.category,
                source: "persistent_market_seed",
                sourceReference: item.sourceReference,
                text: content,
            };
        });

        await storeChunks(chunksToStore);
        console.log(`[MarketKnowledge] Successfully seeded ${chunksToStore.length} market knowledge items.`);
    } catch (err: any) {
        console.warn("[MarketKnowledge] Seeding error (non-blocking):", err?.message || err);
    }
}

/**
 * Retrieves relevant persistent market knowledge chunks
 */
export async function getMarketContext(query: string, role?: string): Promise<string> {
    try {
        await seedMarketKnowledge();

        const results = await searchVectors({
            query: `${role || ""} ${query}`.trim(),
            sourceType: "market",
            targetRole: role,
            limit: 3,
        });

        if (results.length === 0) {
            // If no specific match, find general market knowledge for the role
            const fallback = SEED_MARKET_KNOWLEDGE.find(
                (k) => role && k.role.toLowerCase().includes(role.toLowerCase())
            ) || SEED_MARKET_KNOWLEDGE[0];

            return `Role: ${fallback.role}\nIn-Demand Skills: ${fallback.skills.join(", ")}\nRequirements: ${fallback.requirements.join("; ")}\nTools: ${fallback.toolsAndFrameworks.join(", ")}\nTrends: ${fallback.emergingTrends.join(", ")}`;
        }

        return results.map((r) => r.text).join("\n\n---\n\n");
    } catch (err: any) {
        console.warn("[MarketKnowledge] Error retrieving market context:", err?.message || err);
        return "";
    }
}
