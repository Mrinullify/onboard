import Calendar from "@/components/dashboard/Calendar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import StatCard from "@/components/dashboard/StatCard";
import { Brain, FileText, Mic, Trophy } from "lucide-react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export default async function DashBoardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/sign-in");
    }

    const userId = (session.user.id ?? "") as string;
    const name = session.user.name;

    // Fetch data in parallel
    const [resumeAnalysis, attempts, mcqCount] = await Promise.all([
        prisma.resumeAnalysis.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.assessmentAttempt.findMany({
            where: { userId },
            include: { test: true },
        }),
        prisma.assessmentAnswer.count({
            where: {
                assessmentAttempt: { userId },
                assessmentQuestion: { questionType: "MCQ" },
                userAnswer: { not: null },
            },
        }),
    ]);

    const resumeScore = resumeAnalysis?.atsScore ? Math.round(resumeAnalysis.atsScore) : 0;
    const avgAssessmentScore = attempts.length
        ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / attempts.length)
        : 0;
    const mcqsAttempted = mcqCount;
    const assessmentsTaken = attempts.length;

    // Recent activities (latest 5 assessments + 5 resumes)
    const recentActivities: ActivityItem[] = [];
    const recentAttempts = attempts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
    recentAttempts.forEach((a) => {
        recentActivities.push({
            id: a.id,
            type: "assessment",
            title: a.test.title,
            description: `${a.percentage?.toFixed(0) ?? 0}%`,
            time: formatDistanceToNow(a.createdAt, { addSuffix: true }),
        });
    });
    const recentResumes = await prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
    });
    recentResumes.forEach((r) => {
        recentActivities.push({
            id: r.id,
            type: "resume",
            title: "Resume Uploaded",
            description: r.fileName,
            time: formatDistanceToNow(r.createdAt, { addSuffix: true }),
        });
    });
    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <div className="space-y-8">
            <DashboardHero name={name} />

            {/* Stats Section */}
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Performance Overview</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Resume Score"
                        value={resumeScore}
                        duration={1}
                        suffix="%"
                        description="Strong ATS compatibility"
                        icon={<FileText size={18} />}
                    />
                    <StatCard
                        title="Avg Assessment Score"
                        value={avgAssessmentScore}
                        duration={1.5}
                        suffix="%"
                        description="Across all assessments"
                        icon={<Trophy size={18} />}
                    />
                    <StatCard
                        title="MCQs Attempted"
                        value={mcqsAttempted}
                        duration={1.3}
                        description="Total practice questions"
                        icon={<Brain size={18} />}
                    />
                    <StatCard
                        title="Assessments Taken"
                        value={assessmentsTaken}
                        duration={1.2}
                        description="Assessments completed"
                        icon={<Mic size={18} />}
                    />
                </div>
            </div>

            {/* Calendar & Activity */}
            <Calendar />
            <RecentActivity activities={recentActivities} />
        </div>
    );
}

interface ActivityItem {
    id: string | number;
    type: "assessment" | "resume";
    title: string;
    description: string;
    time: string;
}