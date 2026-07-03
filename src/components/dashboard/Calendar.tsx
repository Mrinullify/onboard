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
        <div className="rounded-3xl border bg-card p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                    🔥 12 Day Streak
                </h2>

                <p className="text-sm text-muted-foreground">
                    Stay consistent and keep improving.
                </p>
            </div>

            <div className="w-full overflow-x-auto">
                <ActivityCalendar
                    data={activityData}
                    showWeekdayLabels
                    blockSize={18}
                    blockMargin={4}
                    fontSize={14}
                    showColorLegend={false}
                    showTotalCount={false}
                    theme={{
                        light: [
                            "#A6A6A6", // Gray
                            "#00750E", // Green
                        ],
                        dark: [
                            "#A6A6A6", // Dark Gray
                            "#00750E", // Green
                        ],
                    }}
                />
            </div>
        </div>
    );
}