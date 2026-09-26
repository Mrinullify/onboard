"use client";

import CountUp from "react-countup";
import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    description: string;
    icon: ReactNode;
    duration: number;

    previousValue?: number;

    mcqsSolvedToday?: number;

    assessmentsThisWeek?: number;
}

export default function StatCard({
    title,
    value,
    suffix = "",
    description,
    icon,
    duration,
    previousValue,
    mcqsSolvedToday,
    assessmentsThisWeek,
}: StatCardProps) {


    // Functions for checking trends
    const hasTrend =
        previousValue !== undefined;

    const isPositive =
        previousValue !== undefined &&
        value > previousValue;

    const scoreDifference =
        previousValue !== undefined
            ? value - previousValue
            : 0;


    return (
        <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:border-border hover:shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {title}
                </h3>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
                    {icon}
                </div>
            </div>

            <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                    <CountUp
                        end={value}
                        duration={duration}
                    />
                    {suffix}
                </p>

                <div className="mt-2 space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {description}
                    </p>

                    {hasTrend && (
                        <p
                            className={`text-xs font-medium ${isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500"
                                }`}
                        >
                            {isPositive ? "↗" : "↘"}{" "}
                            {Math.abs(scoreDifference)}
                            {suffix}
                            {" from last report"}
                        </p>
                    )}

                    {mcqsSolvedToday !== undefined &&
                        mcqsSolvedToday > 0 && (
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                +{mcqsSolvedToday} today
                            </p>
                        )}

                    {assessmentsThisWeek !== undefined &&
                        assessmentsThisWeek > 0 && (
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                {assessmentsThisWeek} this week
                            </p>
                        )}
                </div>
            </div>
        </div>
    );
}