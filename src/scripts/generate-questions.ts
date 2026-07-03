import { generateQuestions } from "@/lib/gemini";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // get interview
    const interview = await prisma.interview.findFirst({
        where: {
            role: "Frontend Developer"
        }
    })

    if (!interview) {
        throw new Error("Interview not found");
    }

    const questions = await generateQuestions(
        interview.role,
        interview.difficulty
    );

    console.log("Generated:", questions.length, "questions.");

    // store questions
    await prisma.question.createMany({
        data: questions.map((q: any) => ({
            questionText: q.questionText,
            type: q.type,
            difficulty: interview.difficulty,
            interviewId: interview.id
        }))
    })
    console.log("Questions saved to DB");
}

main()
    .then(async () => {
        prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect()
        process.exit(1);
    })