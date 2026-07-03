"use client";

import { roles } from "@/components/interview/constants/roles";
import { allTopics } from "@/components/interview/constants/topics";
import InterviewBuilder from "@/components/interview/InterviewBuilder";
import DifficultySection from "@/components/interview/sections/DifficultySection";
import DurationSection from "@/components/interview/sections/DurationSection";
import ExperienceSection from "@/components/interview/sections/ExperienceSection";
import HeroSection from "@/components/interview/sections/HeroSection";
import InterviewTypeSection from "@/components/interview/sections/InterviewTypeSection";
import RoleSelection from "@/components/interview/sections/RoleSection";
import { InterviewSetup } from "@/components/interview/types/interview";
import MultiSearchableSelect from "@/components/ui/MultiSearchableSelect";
import { useState } from "react";

export default function Page() {
    const [setup, setSetup] = useState<InterviewSetup>({
        interviewType: "",
        role: "",
        experience: "",
        difficulty: "medium",
        topics: [],
        formats: [],
        duration: 30,
        aiStyle: "professional",
    });
    return (
        <InterviewBuilder setup={setup} setSetup={setSetup}>
            <HeroSection />
            <InterviewTypeSection setup={setup} setSetup={setSetup} />

            {/* Role SECTION */}
            <RoleSelection roles={roles} setup={setup} setSetup={setSetup} />

            {/* Difficulty Section */}
            <DifficultySection setup={setup} setSetup={setSetup} />

            {/* EXP section */}
            <ExperienceSection setup={setup} setSetup={setSetup} />

            {/* Multi-SEARCHABLE SELECT */}
            <MultiSearchableSelect
                value={setup.topics}
                onChange={(val) => setSetup({ ...setup, topics: val })}
                options={allTopics}
                placeholder="Select Topics"
                searchPlaceholder="Search..."
                emptyMessage="No Topics Found."
            />

            {/* Duration Section */}
            <DurationSection setup={setup} setSetup={setSetup} />

        </InterviewBuilder>
    );
}