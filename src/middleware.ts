import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;

    const isAuthPage =
        req.nextUrl.pathname.startsWith("/sign-in") ||
        req.nextUrl.pathname.startsWith("/sign-up") ||
        req.nextUrl.pathname.startsWith("/verify");

    if (isAuthPage && isLoggedIn) {
        return Response.redirect(
            new URL("/dashboard", req.nextUrl)
        );
    }

    if (!isLoggedIn && !isAuthPage) {
        return Response.redirect(
            new URL("/sign-in", req.nextUrl)
        );
    }
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};