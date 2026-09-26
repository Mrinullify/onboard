"use client";

import { ActivityCalendar } from "react-activity-calendar";

function generateDummyData() {
    const data = [];

    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-12-31");

    for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + 1)
    ) {
        const count = Math.random() > 0.7
            ? Math.floor(Math.random() * 10)
            : 0;

        data.push({
            date: date.toISOString().split("T")[0],
            count,
            level: count > 0 ? 1 : 0,
        });
    }

    return data;
}


export default function Calendar() {
    const activityData = generateDummyData();

    return (
        <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <span className="text-amber-500">🔥</span> Consistency &amp; Practice Activity
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Track daily assessments, question practice, and preparation momentum.
                    </p>
                </div>

                <div className="self-start sm:self-auto rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    🔥 12 Day Streak
                </div>
            </div>

            <div className="w-full overflow-x-auto py-2">
                <ActivityCalendar
                    data={activityData}
                    showWeekdayLabels
                    blockSize={14}
                    blockMargin={4}
                    fontSize={12}
                    showColorLegend={false}
                    showTotalCount={false}
                    theme={{
                        light: [
                            "#EAE9E4", // Warm soft neutral empty
                            "#3B497A", // Refined muted primary
                        ],
                        dark: [
                            "#27272A", // Dark neutral empty
                            "#6366F1", // Indigo active
                        ],
                    }}
                />
            </div>
        </div>
    );
}