export interface TextChunk {
    text: string;
    section?: string;
}

const SECTION_HEADERS: { pattern: RegExp; name: string }[] = [
    { pattern: /(?:^|\n)\s*(?:technical\s+)?skills(?:\s*&?\s*abilities)?\b/i, name: "skills" },
    { pattern: /(?:^|\n)\s*(?:work\s+)?experience|employment\s+history|career\s+history\b/i, name: "experience" },
    { pattern: /(?:^|\n)\s*projects|key\s+projects|personal\s+projects\b/i, name: "projects" },
    { pattern: /(?:^|\n)\s*education|academic\s+background|qualifications\b/i, name: "education" },
    { pattern: /(?:^|\n)\s*certifications?|licenses?|credentials\b/i, name: "certifications" },
    { pattern: /(?:^|\n)\s*summary|professional\s+summary|profile|about\s+me\b/i, name: "summary" },
    { pattern: /(?:^|\n)\s*strengths|key\s+strengths\b/i, name: "strengths" },
    { pattern: /(?:^|\n)\s*weaknesses|areas\s+of\s+improvement\b/i, name: "weaknesses" },
    { pattern: /(?:^|\n)\s*recommendations?|action\s+items?\b/i, name: "recommendations" },
    { pattern: /(?:^|\n)\s*feedback|ai\s+feedback|evaluation\b/i, name: "feedback" },
];

export function chunkResumeText(text: string, maxChunkLength = 800, overlap = 150): TextChunk[] {
    const cleaned = text.trim();
    if (!cleaned) return [];

    // Identify section boundaries
    const sections: { name: string; startIndex: number }[] = [];

    for (const header of SECTION_HEADERS) {
        const matches = Array.from(cleaned.matchAll(new RegExp(header.pattern, "gim")));
        for (const match of matches) {
            if (match.index !== undefined) {
                sections.push({ name: header.name, startIndex: match.index });
            }
        }
    }

    sections.sort((a, b) => a.startIndex - b.startIndex);

    // If section boundaries found, chunk by section
    if (sections.length > 0) {
        const chunks: TextChunk[] = [];

        for (let i = 0; i < sections.length; i++) {
            const current = sections[i];
            const nextStart = i < sections.length - 1 ? sections[i + 1].startIndex : cleaned.length;
            const sectionContent = cleaned.slice(current.startIndex, nextStart).trim();

            if (sectionContent.length <= maxChunkLength) {
                if (sectionContent.length > 10) {
                    chunks.push({ text: sectionContent, section: current.name });
                }
            } else {
                // Sub-chunk long section with sliding window
                const subChunks = slidingWindowChunk(sectionContent, maxChunkLength, overlap);
                for (const sub of subChunks) {
                    chunks.push({ text: sub, section: current.name });
                }
            }
        }

        // Check if there was pre-header text (e.g. contact info/name/intro)
        if (sections[0].startIndex > 50) {
            const intro = cleaned.slice(0, sections[0].startIndex).trim();
            chunks.unshift({ text: intro, section: "summary" });
        }

        return chunks;
    }

    // Fallback: sliding window chunking
    const simpleChunks = slidingWindowChunk(cleaned, maxChunkLength, overlap);
    return simpleChunks.map((chunk) => ({ text: chunk, section: "general" }));
}

export function chunkGeneralText(text: string, maxChunkLength = 600, overlap = 100): string[] {
    return slidingWindowChunk(text, maxChunkLength, overlap);
}

function slidingWindowChunk(text: string, maxLength: number, overlap: number): string[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const para of paragraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) continue;

        if ((currentChunk + "\n\n" + cleanPara).length <= maxLength) {
            currentChunk = currentChunk ? `${currentChunk}\n\n${cleanPara}` : cleanPara;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            // If single paragraph is larger than maxLength, split by sentences or line breaks
            if (cleanPara.length > maxLength) {
                const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [cleanPara];
                let sentenceChunk = "";

                for (const sentence of sentences) {
                    if ((sentenceChunk + " " + sentence).length <= maxLength) {
                        sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentence.trim()}` : sentence.trim();
                    } else {
                        if (sentenceChunk) chunks.push(sentenceChunk);
                        sentenceChunk = sentence.trim();
                    }
                }
                if (sentenceChunk) {
                    currentChunk = sentenceChunk;
                } else {
                    currentChunk = "";
                }
            } else {
                currentChunk = cleanPara;
            }
        }
    }

    if (currentChunk && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter((c) => c.length > 15);
}
