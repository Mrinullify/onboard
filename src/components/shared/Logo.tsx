"use client";

import Lottie from "lottie-react";
import logoAnimation from "@/animations/logo.json";

export default function Logo() {
    return (
        <Lottie
            animationData={logoAnimation}
            loop={false}
            className="h-15 w-28"
        />
    )
}