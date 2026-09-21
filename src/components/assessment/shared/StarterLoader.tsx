import Lottie from "lottie-react";
import animationData from "@/animations/test_loader.json"

export default function AssessmentLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Lottie
                animationData={animationData}
                loop
                className="w-72 h-72"
            />
        </div>
    )
}
