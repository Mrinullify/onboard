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

        const latestResume = await prisma.resume.findFirst({
            where: { userId },
            orderBy: { version: "desc" },
            include: {
                analyses: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!latestResume) {
            return NextResponse.json({
                success: true,
                resume: null,
                analysis: null,
            });
        }

        return NextResponse.json({
            success: true,
            resume: {
                id: latestResume.id,
                fileName: latestResume.fileName,
                version: latestResume.version,
                targetRole: latestResume.targetRole,
                filePath: latestResume.filePath,
                createdAt: latestResume.createdAt,
            },
            analysis: latestResume.analyses[0] || null,
        });
    } catch (err: any) {
        console.error("[GET /api/resume/latest] Error:", err);
        return NextResponse.json(
            { success: false, error: "Failed to fetch latest resume." },
            { status: 500 }
        );
    }
}
