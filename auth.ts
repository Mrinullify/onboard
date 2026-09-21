import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
        ...authConfig.providers,
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
                    throw new CredentialsSignin("Please enter your email and password");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user) {
                    throw new CredentialsSignin("User not found");
                }

                if (!user.password) {
                    throw new CredentialsSignin("Please sign in with Google");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password!);
                if (!isPasswordValid) {
                    throw new CredentialsSignin("Invalid password");
                }

                return user;
            }
        })
    ],
})