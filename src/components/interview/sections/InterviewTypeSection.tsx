"use client";

import { Card } from "@/components/ui/card";
import { interviewTypes } from "../constants/interviewTypes";
import { cn } from "@/lib/utils";
import { InterviewSetup } from "../types/interview";
import { CheckCircle2 } from "lucide-react";
import { toggleObjectState } from "@/lib/state-utils";

export type Props = {
    setup: InterviewSetup;
    setSetup: React.Dispatch<React.SetStateAction<InterviewSetup>>;
};

// Get the InterviewType from InterviewSetup
export type InterviewType = InterviewSetup['interviewType'];

export default function InterviewTypeSection({ setup, setSetup }: Props) {
    const handleSelect = (id: InterviewType) => {
        toggleObjectState(setSetup, "interviewType", id, "");
    };

    return (
        <div className="space-y-4">

            {/* Section Title */}
            <div>
                <h2 className="text-lg font-semibold">Interview Type</h2>
                <p className="text-sm text-muted-foreground">
                    Choose the type of interview you want to practice
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interviewTypes.map((type) => {
                    const isActive = setup.interviewType === type.id;

                    return (
                        <Card
                            key={type.id}
                            onClick={() => handleSelect(type.id)}
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:shadow-md border",
                                isActive &&
                                "border-emerald-500 bg-emerald-100 shadow-sm"
                            )}
                        >
                            <div className="flex items-start gap-3">

                                {/* Icon */}
                                <div className="text-2xl">{type.icon}</div>

                                {/* Content */}
                                <div>
                                    <h3 className="font-medium">{type.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {type.desc}
                                    </p>
                                </div>

                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}