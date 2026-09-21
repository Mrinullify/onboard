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
        <div
            className="
            rounded-3xl
            border
            bg-card
            p-6
        "
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {title}
                </h3>

                {icon}
            </div>

            <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">
                    <CountUp
                        end={value}
                        duration={duration}
                    />
                    {suffix}
                </p>

                <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>

                    {hasTrend && (
                        <p
                            className={`text-sm font-medium ${isPositive
                                ? "text-green-500"
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
                            <p className="text-sm font-medium text-green-500">
                                +{mcqsSolvedToday} today
                            </p>
                        )}

                    {assessmentsThisWeek !== undefined &&
                        assessmentsThisWeek > 0 && (
                            <p className="text-sm font-medium text-green-500">
                                {assessmentsThisWeek} this week
                            </p>
                        )}
                </div>
            </div>
        </div>
    );
}