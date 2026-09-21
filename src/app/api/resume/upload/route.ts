import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { parseResume } from "@/lib/career-agent/resume-parser";
import { chunkResumeText } from "@/lib/career-agent/chunker";
import { fileStorage } from "@/lib/career-agent/file-storage";
import { storeChunks } from "@/lib/career-agent/vector-store";
import { analyzeResume } from "@/lib/career-agent/resume-analyzer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const targetRole = (formData.get("targetRole") as string | null) || undefined;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No resume file provided." },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name || "resume.pdf";
        const extension = fileName.split(".").pop() || "pdf";

        // 1. Extract plain text from PDF / DOCX
        const extractedText = await parseResume(buffer, fileName);

        if (!extractedText || extractedText.trim().length < 20) {
            return NextResponse.json(
                { success: false, error: "Could not extract readable text from the uploaded file." },
                { status: 400 }
            );
        }

        // 2. Determine next version number for this user
        const existingCount = await prisma.resume.count({
            where: { userId },
        });
        const version = existingCount + 1;

        // 3. Create Resume record in PostgreSQL (authoritative source of truth)
        const resume = await prisma.resume.create({
            data: {
                userId,
                version,
                fileName,
                extractedText,
                targetRole: targetRole || null,
            },
        });

        // 4. Save file to local storage (or cloud storage abstraction)
        let filePath: string | null = null;
        try {
            filePath = await fileStorage.saveFile({
                userId,
                resumeId: resume.id,
                extension,
                buffer,
            });

            await prisma.resume.update({
                where: { id: resume.id },
                data: { filePath },
            });
        } catch (storageErr) {
            console.warn("[ResumeUpload] Warning: Local file storage error (non-fatal):", storageErr);
        }

        // 5. Chunk resume text and store in Vector DB
        try {
            const textChunks = chunkResumeText(extractedText);
            const chunkInputs = textChunks.map((c) => ({
                userId,
                sourceType: "resume" as const,
                resumeId: resume.id,
                resumeVersion: version,
                section: c.section || "general",
                targetRole: targetRole || null,
                source: "user_upload",
                sourceReference: fileName,
                text: c.text,
            }));

            await storeChunks(chunkInputs);
        } catch (vectorErr) {
            console.warn("[ResumeUpload] Vector indexing warning (non-fatal):", vectorErr);
        }

        // 6. Perform AI Resume Analysis via Groq
        const analysisResult = await analyzeResume(extractedText, targetRole);

        // 7. Store Resume Analysis in PostgreSQL
        const savedAnalysis = await prisma.resumeAnalysis.create({
            data: {
                userId,
                resumeId: resume.id,
                score: analysisResult.score,
                atsScore: analysisResult.atsScore,
                grammarScore: analysisResult.grammarScore,
                strengths: analysisResult.strengths,
                weaknesses: analysisResult.weaknesses,
                missingSkills: analysisResult.missingSkills,
                recommendations: analysisResult.recommendations,
                feedback: analysisResult.feedback,
            },
        });

        // 8. Embed useful feedback into Vector DB as resume_feedback
        try {
            const feedbackText = `
Resume Version ${version} Analysis:
Score: ${analysisResult.score}/100, ATS Score: ${analysisResult.atsScore}%
Strengths: ${analysisResult.strengths.join("; ")}
Weaknesses: ${analysisResult.weaknesses.join("; ")}
Missing Skills: ${analysisResult.missingSkills.join(", ")}
Recommendations: ${analysisResult.recommendations.join("; ")}
Feedback Summary: ${analysisResult.feedback}
`.trim();

            await storeChunks([
                {
                    userId,
                    sourceType: "resume_feedback",
                    resumeId: resume.id,
                    resumeVersion: version,
                    section: "feedback",
                    targetRole: targetRole || null,
                    source: "ai_analysis",
                    sourceReference: `Analysis for ${fileName} (v${version})`,
                    text: feedbackText,
                },
            ]);
        } catch (feedbackVectorErr) {
            console.warn("[ResumeUpload] Feedback vector indexing warning:", feedbackVectorErr);
        }

        return NextResponse.json(
            {
                success: true,
                resume: {
                    id: resume.id,
                    fileName: resume.fileName,
                    version: resume.version,
                    createdAt: resume.createdAt,
                    targetRole: resume.targetRole,
                },
                analysis: savedAnalysis,
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("[POST /api/resume/upload] Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to upload and analyze resume." },
            { status: 500 }
        );
    }
}
