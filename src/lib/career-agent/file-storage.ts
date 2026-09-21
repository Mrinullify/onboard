import fs from "fs/promises";
import path from "path";

export interface SaveFileParams {
    userId: string;
    resumeId: string;
    extension: string;
    buffer: Buffer;
}

export interface FileStorageProvider {
    saveFile(params: SaveFileParams): Promise<string>;
    getFile(filePath: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;
}

export class LocalFileStorage implements FileStorageProvider {
    private baseDir: string;

    constructor(baseDir?: string) {
        this.baseDir = baseDir || path.join(process.cwd(), "public", "uploads", "resumes");
    }

    async saveFile({ userId, resumeId, extension, buffer }: SaveFileParams): Promise<string> {
        const sanitizedExt = extension.replace(/^\./, "");
        const userDir = path.join(this.baseDir, userId);
        await fs.mkdir(userDir, { recursive: true });

        const fileName = `${resumeId}.${sanitizedExt}`;
        const absolutePath = path.join(userDir, fileName);
        await fs.writeFile(absolutePath, buffer);

        // Store relative path accessible via public or internal loader
        const relativePath = `/uploads/resumes/${userId}/${fileName}`;
        return relativePath;
    }

    async getFile(filePath: string): Promise<Buffer> {
        // Strip leading slash if present to safely join with process.cwd() or baseDir
        const normalized = filePath.startsWith("/uploads/resumes")
            ? path.join(process.cwd(), "public", filePath)
            : filePath;

        return await fs.readFile(normalized);
    }

    async deleteFile(filePath: string): Promise<void> {
        try {
            const normalized = filePath.startsWith("/uploads/resumes")
                ? path.join(process.cwd(), "public", filePath)
                : filePath;
            await fs.unlink(normalized);
        } catch (err) {
            console.warn(`[LocalFileStorage] Failed to delete file at ${filePath}:`, err);
        }
    }
}

// Default export singleton provider instance
export const fileStorage: FileStorageProvider = new LocalFileStorage();
