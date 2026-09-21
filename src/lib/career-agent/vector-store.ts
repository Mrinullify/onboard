import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";
import { DEFAULT_COLLECTION, ensureQdrantCollection, getQdrantClient } from "./qdrant";
import { VectorChunkMetadata, VectorSearchResult, VectorSourceType } from "./types";
import crypto from "crypto";

export interface CreateChunkInput extends VectorChunkMetadata {
    text: string;
}

export interface SearchVectorsParams {
    query: string;
    userId?: string; // MANDATORY for personal retrieval (resume, resume_feedback)
    sourceType?: VectorSourceType;
    targetRole?: string;
    resumeId?: string;
    limit?: number;
}

/**
 * Converts any string ID (like cuid) to a deterministic standard UUID v4 format for Qdrant point IDs
 */
function toUuid(id: string): string {
    const hash = crypto.createHash("md5").update(id).digest("hex");
    return [
        hash.substring(0, 8),
        hash.substring(8, 12),
        "4" + hash.substring(13, 16),
        ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
        hash.substring(20, 32),
    ].join("-");
}

/**
 * Stores chunks in PostgreSQL (Source of Truth) and vectors in Qdrant (Semantic Layer)
 */
export async function storeChunks(chunks: CreateChunkInput[]): Promise<string[]> {
    if (!chunks || chunks.length === 0) return [];

    const createdChunkIds: string[] = [];

    for (const chunk of chunks) {
        // 1. Authoritative insert into PostgreSQL
        const dbRecord = await prisma.vectorChunk.create({
            data: {
                userId: chunk.userId || null,
                sourceType: chunk.sourceType,
                resumeId: chunk.resumeId || null,
                resumeVersion: chunk.resumeVersion || null,
                section: chunk.section || null,
                targetRole: chunk.targetRole || null,
                source: chunk.source || null,
                sourceReference: chunk.sourceReference || null,
                text: chunk.text,
            },
        });

        createdChunkIds.push(dbRecord.id);

        // 2. Generate embedding & index in Qdrant
        try {
            const hasCollection = await ensureQdrantCollection();
            if (hasCollection) {
                const vector = await generateEmbedding(chunk.text);
                const qdrant = getQdrantClient();
                const pointId = toUuid(dbRecord.id);

                await qdrant.upsert(DEFAULT_COLLECTION, {
                    wait: true,
                    points: [
                        {
                            id: pointId,
                            vector,
                            payload: {
                                chunkId: dbRecord.id,
                                userId: chunk.userId || null,
                                sourceType: chunk.sourceType,
                                resumeId: chunk.resumeId || null,
                                resumeVersion: chunk.resumeVersion || null,
                                section: chunk.section || null,
                                targetRole: chunk.targetRole || null,
                                source: chunk.source || null,
                                sourceReference: chunk.sourceReference || null,
                                text: chunk.text,
                                createdAt: dbRecord.createdAt.toISOString(),
                            },
                        },
                    ],
                });
            }
        } catch (err: any) {
            console.warn(`[VectorStore] Qdrant index warning for chunk ${dbRecord.id}:`, err?.message || err);
            // Non-blocking: PostgreSQL is authoritative
        }
    }

    return createdChunkIds;
}

/**
 * Semantic vector search with strict User Isolation & PostgreSQL fallback
 */
export async function searchVectors(params: SearchVectorsParams): Promise<VectorSearchResult[]> {
    const { query, userId, sourceType, targetRole, resumeId, limit = 5 } = params;

    // SECURITY CHECK: Personal data MUST have authenticated userId
    if ((sourceType === "resume" || sourceType === "resume_feedback") && !userId) {
        throw new Error("Security Violation: userId is required for personal vector retrieval");
    }

    // Try Qdrant retrieval first
    try {
        const hasCollection = await ensureQdrantCollection();
        if (hasCollection) {
            const queryVector = await generateEmbedding(query);
            const qdrant = getQdrantClient();

            // Build Qdrant filter conditions
            const mustConditions: any[] = [];

            // Personal security filter
            if (userId) {
                mustConditions.push({
                    key: "userId",
                    match: { value: userId },
                });
            }

            if (sourceType) {
                mustConditions.push({
                    key: "sourceType",
                    match: { value: sourceType },
                });
            }

            if (resumeId) {
                mustConditions.push({
                    key: "resumeId",
                    match: { value: resumeId },
                });
            }

            if (targetRole) {
                mustConditions.push({
                    key: "targetRole",
                    match: { value: targetRole },
                });
            }

            const searchFilter = mustConditions.length > 0 ? { must: mustConditions } : undefined;

            const response = await qdrant.query(DEFAULT_COLLECTION, {
                query: queryVector,
                limit,
                filter: searchFilter,
                with_payload: true,
            });

            const points = (response as any)?.points || response;

            if (Array.isArray(points) && points.length > 0) {
                return points.map((hit: any) => {
                    const payload = (hit.payload || {}) as any;
                    return {
                        id: payload.chunkId || String(hit.id),
                        score: hit.score,
                        text: payload.text || "",
                        metadata: {
                            userId: payload.userId || null,
                            sourceType: payload.sourceType,
                            resumeId: payload.resumeId || null,
                            resumeVersion: payload.resumeVersion || null,
                            section: payload.section || null,
                            targetRole: payload.targetRole || null,
                            source: payload.source || null,
                            sourceReference: payload.sourceReference || null,
                        },
                    };
                });
            }
        }
    } catch (err: any) {
        console.warn("[VectorStore] Qdrant search fallback to PostgreSQL:", err?.message || err);
    }

    // Fallback: PostgreSQL keyword search (User isolated)
    return await searchPostgresFallback(params);
}

/**
 * Robust PostgreSQL fallback search using ILIKE / keyword matching
 */
async function searchPostgresFallback(params: SearchVectorsParams): Promise<VectorSearchResult[]> {
    const { query, userId, sourceType, targetRole, resumeId, limit = 5 } = params;

    const keywords = query
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const where: any = {};

    if (userId) {
        where.userId = userId;
    }
    if (sourceType) {
        where.sourceType = sourceType;
    }
    if (resumeId) {
        where.resumeId = resumeId;
    }
    if (targetRole) {
        where.targetRole = targetRole;
    }

    if (keywords.length > 0) {
        where.OR = keywords.map((kw) => ({
            text: { contains: kw, mode: "insensitive" },
        }));
    }

    const records = await prisma.vectorChunk.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
    });

    return records.map((rec) => ({
        id: rec.id,
        score: 0.75, // fallback baseline score
        text: rec.text,
        metadata: {
            userId: rec.userId,
            sourceType: rec.sourceType as VectorSourceType,
            resumeId: rec.resumeId,
            resumeVersion: rec.resumeVersion,
            section: rec.section,
            targetRole: rec.targetRole,
            source: rec.source,
            sourceReference: rec.sourceReference,
        },
    }));
}

/**
 * Delete vectors associated with a specific resume
 */
export async function deleteChunksByResumeId(resumeId: string, userId: string): Promise<void> {
    // 1. Find chunk IDs in DB
    const chunks = await prisma.vectorChunk.findMany({
        where: { resumeId, userId },
        select: { id: true },
    });

    if (chunks.length === 0) return;

    // 2. Delete from Qdrant
    try {
        const hasCollection = await ensureQdrantCollection();
        if (hasCollection) {
            const qdrant = getQdrantClient();
            const pointIds = chunks.map((c) => toUuid(c.id));
            await qdrant.delete(DEFAULT_COLLECTION, {
                points: pointIds,
            });
        }
    } catch (err: any) {
        console.warn(`[VectorStore] Could not delete Qdrant points for resume ${resumeId}:`, err?.message || err);
    }

    // 3. Delete from PostgreSQL
    await prisma.vectorChunk.deleteMany({
        where: { resumeId, userId },
    });
}
