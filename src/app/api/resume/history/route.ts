import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: { version: "desc" },
            include: {
                analyses: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        return NextResponse.json({
            success: true,
            resumes: resumes.map((r) => ({
                id: r.id,
                fileName: r.fileName,
                version: r.version,
                targetRole: r.targetRole,
                filePath: r.filePath,
                createdAt: r.createdAt,
                analysis: r.analyses[0] || null,
            })),
        });
    } catch (err: any) {
        console.error("[GET /api/resume/history] Error:", err);
        return NextResponse.json(
            { success: false, error: "Failed to fetch resume history." },
            { status: 500 }
        );
    }
}
