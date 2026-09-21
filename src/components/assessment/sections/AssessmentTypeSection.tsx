"use client";

import { Card } from "@/components/ui/card";
import { assessmentTypes } from "../constants/assessmentTypes";
import { cn } from "@/lib/utils";
import { AssessmentSetup } from "../types/assessment";
import { CheckCircle2 } from "lucide-react";
import { toggleObjectState } from "@/lib/state-utils";

export type Props = {
    setup: AssessmentSetup;
    setSetup: React.Dispatch<React.SetStateAction<AssessmentSetup>>;
};

// Get the AssessmentType from AssessmentSetup
export type AssessmentType = AssessmentSetup['assessmentType'];

export default function AssessmentTypeSection({ setup, setSetup }: Props) {
    const handleSelect = (id: AssessmentType) => {
        toggleObjectState(setSetup, "assessmentType", id, "");
    };

    return (
        <div className="space-y-4">

            {/* Section Title */}
            <div>
                <h2 className="text-lg font-semibold">Assessment Type</h2>
                <p className="text-sm text-muted-foreground">
                    Choose the type of assessment you want to practice
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessmentTypes.map((type) => {
                    const isActive = setup.assessmentType === type.id;

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
