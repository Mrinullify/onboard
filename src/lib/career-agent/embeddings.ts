import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAIInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured in environment");
        }
        genAIInstance = new GoogleGenerativeAI(apiKey);
    }
    return genAIInstance;
}

export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSION = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
    const clean = text.trim();
    if (!clean) {
        return new Array(EMBEDDING_DIMENSION).fill(0);
    }

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(clean);
        const values = result?.embedding?.values;

        if (!values || values.length === 0) {
            throw new Error("Empty embedding returned by Gemini");
        }

        return values;
    } catch (err: any) {
        console.error("[Embeddings] Error generating embedding:", err);
        throw new Error(`Failed to generate embedding: ${err.message}`);
    }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    // Batch sequentially or in small chunks of 5 to avoid rate limits
    for (const text of texts) {
        const emb = await generateEmbedding(text);
        results.push(emb);
    }
    return results;
}
