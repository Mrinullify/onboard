import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        Google,
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            // custom authorize function to check credentials
            async authorize(credentials: any): Promise<any> {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter your email and password");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user) {
                    throw new Error("User not found");
                }

                if (!user.password) {
                    throw new Error("Please sign in with Google");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password!);
                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return user;
            }
        })
    ],
})