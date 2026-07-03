import { PrismaClient } from "@prisma/client"


const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            email: "damrinal1967@gmail.com"
        }
    })

    if (!user) {
        throw new Error("User not found")

    }

    const interview = await prisma.interview.create({
        data: {
            title: "Frontend Developer Interview",
            role: "Frontend Developer",
            difficulty: "EASY",
            status: "IN_PROGRESS",

            userId: user.id,
        }
    })

    console.log(interview);
}


main().
    then(async () => {
        await prisma.$disconnect();
    }).catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })


