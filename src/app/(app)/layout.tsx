import { ReactNode } from "react";
import Navbar from "@/components/dashboard/Navbar";

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({
    children,
}: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                {children}
            </main>
        </div>
    );
}