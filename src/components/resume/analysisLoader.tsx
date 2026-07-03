import animationData from "../../animations/resume-scan.json";
import Lottie from "lottie-react";

export default function ResumeAnalyzingLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Lottie
                animationData={animationData}
                loop
                className="w-72 h-72"
            />

            <h3 className="mt-4 text-lg font-semibold">
                Analyzing your resume...
            </h3>

            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                Recruiters spend only a few seconds scanning a resume. Strong action
                verbs can significantly improve readability.
            </p>
        </div>
    );
}