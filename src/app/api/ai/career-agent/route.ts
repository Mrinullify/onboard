import { auth } from "../../../../../auth";
import { askCareerAgent } from "@/lib/career-agent/career-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized. Please sign in.",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const body = await req.json().catch(() => ({}));
        const { question, targetRole, resumeId } = body;

        if (
            !question ||
            typeof question !== "string" ||
            question.trim() === ""
        ) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Question is required.",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const result = await askCareerAgent({
            userId: session.user.id,
            question: question.trim(),
            targetRole: targetRole
                ? String(targetRole).trim()
                : undefined,
            resumeId: resumeId
                ? String(resumeId).trim()
                : undefined,
        });

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send metadata first
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: "sources",
                                sources: result.sources,
                                targetRole: result.targetRole,
                            }) + "\n"
                        )
                    );

                    // Stream LLM chunks
                    for await (const chunk of result.stream) {
                        let content = "";

                        if (typeof chunk.content === "string") {
                            content = chunk.content;
                        } else if (Array.isArray(chunk.content)) {
                            content = chunk.content
                                .filter(
                                    (item: any) =>
                                        item.type === "text"
                                )
                                .map(
                                    (item: any) =>
                                        item.text || ""
                                )
                                .join("");
                        }

                        if (!content) continue;

                        controller.enqueue(
                            encoder.encode(
                                JSON.stringify({
                                    type: "chunk",
                                    content,
                                }) + "\n"
                            )
                        );
                    }

                    // Tell frontend generation is finished
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: "done",
                            }) + "\n"
                        )
                    );

                    controller.close();
                } catch (error) {
                    console.error(
                        "[CareerAgent Stream] Error:",
                        error
                    );

                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: "error",
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Streaming failed.",
                            }) + "\n"
                        )
                    );

                    controller.close();
                }
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                "Content-Type": "application/x-ndjson; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (err: any) {
        console.error(
            "[POST /api/ai/career-agent] Error:",
            err
        );

        return new Response(
            JSON.stringify({
                success: false,
                error:
                    err.message ||
                    "Internal server error while processing career query.",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
