"use client"

import { motion, Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { FileText, Calendar, Mic } from "lucide-react";

// Types for activity config
interface ActivityConfigItem {
  icon: LucideIcon;
  color: string;
  actions: ("view" | "delete")[];
}

type ActivityType = "assessment" | "resume";

interface ActivityItem {
  id: number | string;
  type: ActivityType;
  title: string;
  description: string;
  time: string; // formatted string e.g., "2 hours ago"
}

const activityConfig: Record<ActivityType, ActivityConfigItem> = {
  assessment: {
    icon: Mic,
    color: "text-blue-500",
    actions: ["view"],
  },
  resume: {
    icon: FileText,
    color: "text-yellow-500",
    actions: ["view", "delete"],
  },
};

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
};

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="w-full rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your latest assessments and resume reviews</p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {(!activities || activities.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-muted-foreground mb-3">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No recent activity</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Complete a practice assessment or upload your resume to see your activity timeline here.
          </p>
        </div>
      ) : (
        /* LIST */
        <div className="space-y-5">
          {activities.map((activity, idx) => {
            const config = activityConfig[activity.type] || activityConfig.assessment;
            const Icon = config.icon;
            const isLast = idx === activities.length - 1;

            return (
              <div key={activity.id} className="group flex gap-4">
                {/* ICON & LINE */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-foreground/80 shadow-2xs">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {!isLast && <div className="mt-2 h-full w-px bg-border/80" />}
                </div>

                {/* CONTENT */}
                <div className="flex flex-1 items-start justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{activity.description}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground/80">{activity.time}</p>
                  </div>

                  <span className="rounded-full border border-border/80 bg-secondary/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {activity.type === "assessment" ? "Assessment" : "Resume"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}