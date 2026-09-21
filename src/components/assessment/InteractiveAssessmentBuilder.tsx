'use client';

import { useState } from "react";
import { roles } from "@/components/assessment/constants/roles";
import { allTopics } from "@/components/assessment/constants/topics";
import AssessmentBuilder from "@/components/assessment/AssessmentBuilder";
import DifficultySection from "@/components/assessment/sections/DifficultySection";
import DurationSection from "@/components/assessment/sections/DurationSection";
import ExperienceSection from "@/components/assessment/sections/ExperienceSection";
import FormatSection from "@/components/assessment/sections/FormatSection";
import HeroSection from "@/components/assessment/sections/HeroSection";
import AssessmentTypeSection from "@/components/assessment/sections/AssessmentTypeSection";
import RoleSelection from "@/components/assessment/sections/RoleSection";
import { AssessmentSetup } from "@/components/assessment/types/assessment";
import MultiSearchableSelect from "@/components/ui/MultiSearchableSelect";
import AssessmentLoader from "./shared/StarterLoader";
import LanguageSection from "@/components/assessment/sections/LanguageSection";

export default function InteractiveAssessmentBuilder() {
    const [setup, setSetup] = useState<AssessmentSetup>({
        assessmentType: "",
        role: "",
        experience: "",
        difficulty: "medium",
        topics: [],
        formats: [],
        duration: 30,
        aiStyle: "",
        language: "",
    });

    const [loading, setLoading] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <AssessmentLoader />
            </div>
        );
    }

    return (
        <AssessmentBuilder setup={setup} setSetup={setSetup} loading={loading} setLoading={setLoading}>
            <HeroSection />
            <AssessmentTypeSection setup={setup} setSetup={setSetup} />

            {/* Role SECTION */}
            <RoleSelection roles={roles} setup={setup} setSetup={setSetup} />

            {/* Difficulty Section */}
            <DifficultySection setup={setup} setSetup={setSetup} />

            {/* EXP section */}
            <ExperienceSection setup={setup} setSetup={setSetup} />

            {/* Language Section */}
            <LanguageSection setup={setup} setSetup={setSetup} />

            {/* Multi-SEARCHABLE SELECT */}
            <MultiSearchableSelect
                value={setup.topics}
                onChange={(val) => setSetup({ ...setup, topics: val })}
                options={allTopics}
                placeholder="Select Topics"
                searchPlaceholder="Search..."
                emptyMessage="No Topics Found."
            />

            {/* Format Section */}
            <FormatSection setup={setup} setSetup={setSetup} />

            {/* Duration Section */}
            <DurationSection setup={setup} setSetup={setSetup} />
        </AssessmentBuilder>
    );
}
