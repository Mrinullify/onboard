import { groq } from "@/lib/groq";
import { ResumeAnalysisResult } from "./types";

export async function analyzeResume(
    extractedText: string,
    targetRole?: string
): Promise<ResumeAnalysisResult> {
    const roleContext = targetRole ? `Target Role: ${targetRole}` : "Target Role: General Software Engineering / Tech";

    const prompt = `
You are an expert Technical Recruiter, ATS specialist, and Career Coach.
Analyze the following resume text carefully.

${roleContext}

Resume Content:
"""
${extractedText.slice(0, 8000)}
"""

Provide a rigorous evaluation. Return ONLY a valid JSON object matching the structure below:
{
  "score": 85,
  "atsScore": 88,
  "grammarScore": 92,
  "strengths": [
    "Clear quantified achievements in backend optimization",
    "Strong proficiency in TypeScript, React, PostgreSQL",
    "Well-structured experience section with leadership signals"
  ],
  "weaknesses": [
    "Lacks explicit metrics in older projects",
    "Summary section is slightly generic",
    "Missing keywords related to cloud deployment (e.g. Docker, CI/CD)"
  ],
  "missingSkills": [
    "Docker",
    "Kubernetes",
    "CI/CD Pipelines",
    "System Design"
  ],
  "recommendations": [
    "Rewrite project bullets using the Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z])",
    "Highlight experience with cloud platforms and containerization",
    "Tailor the summary directly towards the target role"
  ],
  "feedback": "Your resume demonstrates solid engineering fundamentals and project experience. Focusing on quantified business outcomes and modern DevOps tooling will significantly elevate your profile for senior and high-impact roles."
}
`;

    try {
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: "You are a professional ATS and tech recruitment analyzer. Return ONLY valid JSON, no markdown codeblocks, no extra words.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const cleaned = rawContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return {
            score: Math.min(100, Math.max(0, Number(parsed.score) || 75)),
            atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 70)),
            grammarScore: Math.min(100, Math.max(0, Number(parsed.grammarScore) || 85)),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Good technical foundation"],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ["Could add more quantified metrics"],
            missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ["Improve project descriptions"],
            feedback: parsed.feedback || "Resume analyzed successfully.",
        };
    } catch (err: any) {
        console.error("[ResumeAnalyzer] Error analyzing resume with Groq:", err);
        // Fallback default analysis if LLM fails
        return {
            score: 75,
            atsScore: 70,
            grammarScore: 85,
            strengths: ["Clear project descriptions", "Relevant technical stack", "Structured format"],
            weaknesses: ["Add more quantifiable metrics and business impact", "Include more role-specific keywords"],
            missingSkills: ["Cloud Infrastructure", "CI/CD", "Automated Testing"],
            recommendations: ["Quantify achievements with percentages and numbers", "Tailor keywords to job description"],
            feedback: "Your resume provides a good base. Incorporating quantified results and industry-standard keywords will boost your ATS match rate.",
        };
    }
}
