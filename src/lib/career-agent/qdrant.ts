import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBEDDING_DIMENSION } from "./embeddings";

export const DEFAULT_COLLECTION = process.env.QDRANT_COLLECTION || "career_agent_vectors";

let clientInstance: QdrantClient | null = null;
let collectionInitialized = false;

export function getQdrantClient(): QdrantClient {
    if (!clientInstance) {
        const url = process.env.QDRANT_URL || "http://localhost:6333";
        const apiKey = process.env.QDRANT_API_KEY || undefined;

        clientInstance = new QdrantClient({
            url,
            apiKey: apiKey && apiKey.trim() !== "" ? apiKey : undefined,
            checkCompatibility: false,
        });
    }
    return clientInstance;
}

export async function ensureQdrantCollection(collectionName = DEFAULT_COLLECTION): Promise<boolean> {
    if (collectionInitialized) return true;

    try {
        const client = getQdrantClient();
        const response = await client.getCollections();
        const exists = response.collections.some((c) => c.name === collectionName);

        if (!exists) {
            console.log(`[Qdrant] Creating collection "${collectionName}" with dimension ${EMBEDDING_DIMENSION}...`);
            await client.createCollection(collectionName, {
                vectors: {
                    size: EMBEDDING_DIMENSION,
                    distance: "Cosine",
                },
            });
            console.log(`[Qdrant] Collection "${collectionName}" created successfully.`);
        }

        collectionInitialized = true;
        return true;
    } catch (err: any) {
        console.warn(`[Qdrant] Warning: Could not initialize Qdrant collection "${collectionName}":`, err?.message || err);
        return false;
    }
}
