'use client'

import { ReactNode } from "react";
import { AssessmentSetup } from "./types/assessment";
import StickySummary from "./sidebar/StickySummary";


type Props = {
    children: ReactNode;
    setup: AssessmentSetup;
    setSetup: React.Dispatch<React.SetStateAction<AssessmentSetup>>;
    loading: boolean;
    setLoading: (loading: boolean) => void;
};

export default function AssessmentBuilder({ children, setup, loading, setLoading }: Props) {

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
                        <StickySummary setup={setup} loading={loading} setLoading={setLoading} />
                    </div>

                </div>
            </div>
        </div>
    );
}
