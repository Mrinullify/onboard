import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import InteractiveAssessmentBuilder from "@/components/assessment/InteractiveAssessmentBuilder";
import Navbar from "@/components/dashboard/Navbar";

export default async function Page() {
    const session = await auth();

    if (!session?.user) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <InteractiveAssessmentBuilder />
            </main>
        </div>
    );
}
