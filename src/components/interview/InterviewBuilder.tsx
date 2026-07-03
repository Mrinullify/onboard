'use client'

import { ReactNode } from "react";
import { InterviewSetup } from "./types/interview";
import StickySummary from "./sidebar/StickySummary";


type Props = {
    children: ReactNode;
    setup: InterviewSetup;
    setSetup: React.Dispatch<React.SetStateAction<InterviewSetup>>;
};

export default function InterviewBuilder({ children, setup }: Props) {

    return (
        <div className="min-h-screen bg-background">

            {/* Page Container */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* FLEX ROW goes HERE */}
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* LEFT */}
                    <div className="flex-1 space-y-10">
                        {children}
                    </div>

                    {/* RIGHT */}
                    <div className="w-[340px] hidden lg:block sticky top-6">
                        <StickySummary setup={setup} />
                    </div>

                </div>
            </div>
        </div>
    );
}