import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { buildCareerContext } from "./context-builder";
import { CareerAgentParams } from "./types";

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0.4,
});

export async function askCareerAgent(params: CareerAgentParams) {
    const { userId, question, targetRole, resumeId } = params;

    if (!userId) {
        throw new Error("Authentication required to query Career Agent.");
    }

    if (!question || question.trim() === "") {
        throw new Error("Question cannot be empty.");
    }

    // 1. Build Multi-Source RAG Context
    const context = await buildCareerContext({
        userId,
        question,
        targetRole,
        resumeId,
    });

    // 2. System instructions
    const systemPrompt = `
You are the OnBoard AI Career & Resume Intelligence Agent.

Your goal is to provide accurate, highly actionable, and personalized
career advice based strictly on the user's actual resume data,
historical progression, previous AI feedback, persistent market
knowledge, and live market intelligence.

CRITICAL RULES:

1. Ground your answer strictly in the provided context.
2. DO NOT invent user experience, skills, certifications, projects,
   achievements, or statistics that are not present in the context.
3. DO NOT fabricate market trends or technologies.
4. When identifying skill gaps, compare the user's current skills
   against the available market knowledge and live web information.
5. Give concrete and prioritized next steps.
6. Explain WHY a recommendation matters.
7. Use clear Markdown formatting.
8. Use headings, bullet points, tables, and bold text where useful.
9. Make the response personalized rather than generic.
10. If the context does not contain enough information to make a claim,
    explicitly say that the available data is insufficient.

Structure the response when appropriate using sections such as:

# Personalized Career Intelligence Response

## Goal

## Resume — What to Add / Refine

## Skill Gap Analysis

## Learning Roadmap

## Projects to Showcase

## Certifications

## ATS-Friendly Keywords

## Networking / Job Search Actions

Do not force sections that are irrelevant to the user's question.
`.trim();

    // 3. User/RAG context
    const userPrompt = `
==============================
CURRENT RESUME
==============================
${context.currentResumeContext ?? "None provided."}

==============================
PREVIOUS RESUMES
==============================
${context.resumeHistoryContext ?? "None provided."}

==============================
PREVIOUS FEEDBACK
==============================
${context.previousFeedbackContext ?? "None provided."}

==============================
PERSISTENT MARKET KNOWLEDGE
==============================
${context.persistentMarketContext ?? "None provided."}

==============================
LIVE WEB INFORMATION
==============================
${context.liveWebContext ?? "None provided."}

==============================
USER QUESTION
==============================
${question}

Target Role:
${targetRole || "General Tech / Engineering"}
`.trim();

    // 4. LangChain streaming with explicit Message instances
    const stream = await llm.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
    ]);

    return {
        stream,
        sources: context.sources,
        targetRole,
    };
}