"use client";

import { FileText, Calendar, Mic, LucideIcon } from "lucide-react";
import { motion, Variants } from "framer-motion";

// TYPES AND INTERFACES
interface ActivityConfigItem {
    icon: LucideIcon;
    color: string;
    actions: ("view" | "delete")[];
};

type ActivityType = "assessment" | "schedule" | "resume";

type Activity = {
    id: number;
    type: ActivityType;
    title: string;
    description: string;
    time: string;
};

const activities: Activity[] = [
    {
        id: 1,
        type: "assessment",
        title: "React Assessment Completed",
        description: "Scored 82/100",
        time: "2 hours ago",
    },
    {
        id: 2,
        type: "schedule",
        title: "Assessment Scheduled",
        description: "Frontend Developer - Google",
        time: "Yesterday",
    },
    {
        id: 3,
        type: "resume",
        title: "Resume Uploaded",
        description: "resume_v2.pdf",
        time: "2 days ago",
    },
];

// ICON + COLOR + ACTION CONFIG
const activityConfig: Record<ActivityType, ActivityConfigItem> = {
    assessment: {
        icon: Mic,
        color: "text-blue-500",
        actions: ["view"],
    },
    schedule: {
        icon: Calendar,
        color: "text-green-500",
        actions: ["view"],
    },
    resume: {
        icon: FileText,
        color: "text-yellow-500",
        actions: ["view", "delete"],
    },
};

// ANIMATION
const container: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
    },
};

export function RecentActivity() {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.3 }}
            className="w-1/2 rounded-xl border bg-card p-6"
        >
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Activity</h2>

                <button className="text-sm text-muted-foreground hover:text-foreground">
                    View All →
                </button>
            </div>

            {/* LIST */}
            <div className="space-y-6">
                {activities.map((activity) => {
                    const config = activityConfig[activity.type];
                    const Icon = config.icon;
                    const actions = config.actions;

                    return (
                        <motion.div
                            key={activity.id}
                            variants={item}
                            className="group flex gap-4"
                        >
                            {/* ICON */}
                            <div className="flex flex-col items-center">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background">
                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>

                                <div className="mt-2 h-full w-px bg-border" />
                            </div>

                            {/* CONTENT */}
                            <div className="flex flex-1 items-start justify-between">
                                <div>
                                    <p className="font-medium">{activity.title}</p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {activity.description}
                                    </p>

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {activity.time}
                                    </p>
                                </div>

                                {/* ACTIONS (hover only) */}
                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                                    {actions.includes("view") && (
                                        <button className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/40 cursor-pointer">
                                            View
                                        </button>
                                    )}

                                    {actions.includes("delete") && (
                                        <button className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/40 cursor-pointer">
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}