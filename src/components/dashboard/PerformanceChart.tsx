"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

const data = [
    {
        metric: "Resume",
        value: 82,
    },
    {
        metric: "Interview",
        value: 78,
    },
    {
        metric: "MCQs",
        value: 187,
    },
    {
        metric: "Sessions",
        value: 14,
    },
];

export default function PerformanceChart() {
    return (
        <div className="rounded-3xl border bg-card p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">
                    Performance Overview
                </h2>

                <p className="text-sm text-muted-foreground">
                    Your interview preparation progress.
                </p>
            </div>

            <div className="h-[350px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <BarChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                        />

                        <XAxis dataKey="metric" />

                        <YAxis />

                        <Tooltip />

                        <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}