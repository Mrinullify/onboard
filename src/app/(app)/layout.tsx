import { ReactNode } from "react";
import Navbar from "@/components/dashboard/Navbar";

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({
    children,
}: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8">
                {children}
            </main>
        </div>
    );
}