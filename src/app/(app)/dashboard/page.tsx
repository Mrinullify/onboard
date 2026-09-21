import Calendar from "@/components/dashboard/Calendar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import StatCard from "@/components/dashboard/StatCard";
import { Brain, FileText, Mic, Trophy } from "lucide-react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";

export default async function DashBoardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/sign-in");
    }

    const name = session?.user?.name;


    return (
        <div className="space-y-8">
            <DashboardHero name={name} />

            {/* Stat Card */}
            <div className="grid gap-6 md:grid-cols-2">
                <StatCard
                    title="Resume Score"
                    value={82}
                    duration={1}
                    suffix="%"
                    description="Strong ATS compatibility"
                    icon={<FileText size={20} />}
                />

                <StatCard
                    title="Avg Assessment Score"
                    value={78}
                    duration={1.5}
                    suffix="%"
                    description="Across all assessments"
                    icon={<Trophy size={20} />}
                />

                <StatCard
                    title="MCQs Solved"
                    value={187}
                    duration={1.3}
                    description="Questions completed"
                    icon={<Brain size={20} />}
                />

                <StatCard
                    title="Assessments Taken"
                    value={14}
                    duration={1.2}
                    description="Assessments completed"
                    icon={<Mic size={20} />}
                />
            </div>


            {/* <PerformanceChart /> */}
            <Calendar />
            <RecentActivity />
        </div>
    )
}