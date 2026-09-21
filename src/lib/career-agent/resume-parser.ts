import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export async function parseResume(
    buffer: Buffer,
    fileName: string
): Promise<string> {
    const ext = fileName.toLowerCase().split(".").pop() || "";

    if (ext === "pdf") {
        return parsePdf(buffer);
    } else if (ext === "docx") {
        return parseDocx(buffer);
    } else if (ext === "txt" || ext === "md") {
        return cleanText(buffer.toString("utf-8"));
    } else {
        throw new Error(`Unsupported file type: .${ext}`);
    }
}

async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        const pdf = await getDocumentProxy(
            new Uint8Array(buffer)
        );

        const result = await extractText(pdf, {
            mergePages: true,
        });

        const text = result.text?.trim() || "";

        if (!text) {
            throw new Error(
                "No text content found in PDF. The PDF may be scanned or image-based."
            );
        }

        return cleanText(text);
    } catch (err: any) {
        console.error("[ResumeParser] PDF parsing error:", err);

        throw new Error(
            `Failed to parse PDF: ${err.message}`
        );
    }
}

async function parseDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result?.value?.trim() || "";

        if (!text) {
            throw new Error("No text content found in DOCX");
        }

        return cleanText(text);
    } catch (err: any) {
        console.error("[ResumeParser] DOCX parsing error:", err);
        throw new Error(`Failed to parse DOCX: ${err.message}`);
    }
}

function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}