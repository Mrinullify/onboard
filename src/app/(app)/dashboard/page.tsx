import Calendar from "@/components/dashboard/Calendar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import StatCard from "@/components/dashboard/StatCard";
import { Brain, FileText, Mic, Trophy } from "lucide-react";

export default async function DashBoardPage() {
    return (
        <div className="space-y-8">
            <DashboardHero />

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
                    title="Avg Interview Score"
                    value={78}
                    duration={1.5}
                    suffix="%"
                    description="Across all interviews"
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
                    title="Interviews Taken"
                    value={14}
                    duration={1.2}
                    description="Mock interviews completed"
                    icon={<Mic size={20} />}
                />
            </div>


            {/* <PerformanceChart /> */}
            <Calendar />
            <RecentActivity />
        </div>
    )
}