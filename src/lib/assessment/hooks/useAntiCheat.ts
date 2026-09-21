import { useCallback, useEffect, useState } from "react";
import { useFullscreen } from "./useFullscreen";
import { incrementFullscreenStrikes } from "../actions";
import { toast } from "sonner";

interface UseAntiCheatOptions {
    attemptId: string;
    initialStrikes?: number;
    onTerminate?: () => void;
    isActive?: boolean;
}

export function useAntiCheat({
    attemptId,
    initialStrikes = 0,
    onTerminate,
    isActive = true,
}: UseAntiCheatOptions) {
    const [strikes, setStrikes] = useState(initialStrikes);
    const [isWindowFocused, setIsWindowFocused] = useState(true);

    const handleViolation = useCallback(
        async (type: "fullscreen" | "tab-switch") => {
            if (!isActive) return;

            try {
                const res = await incrementFullscreenStrikes(attemptId);

                if (!res.success) return;

                const currentStrikes = res.strikes ?? 0;
                setStrikes(currentStrikes);

                if (res.terminated) {
                    toast.error("Assessment terminated due to anti-cheat violations.");
                    onTerminate?.();
                } else {
                    toast.warning(`Anti-cheat warning: Strike ${currentStrikes}/3`);
                }
            } catch (error) {
                console.error("Failed to report violation:", error);
            }
        }
        , [attemptId, isActive, onTerminate])

    const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen({
        onExit: () => handleViolation("fullscreen"),
    });

    useEffect(() => {
        if (!isActive) return;

        function handleVisibilityChange() {
            if (document.hidden) {
                setIsWindowFocused(false);
                handleViolation("tab-switch");
            } else {
                setIsWindowFocused(true);
            }
        }

        function handleBlur() {
            setIsWindowFocused(false);
            handleViolation("tab-switch");
        }

        function handleFocus() {
            setIsWindowFocused(true);
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, [isActive, handleViolation]);

    return {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        strikes,
        isWindowFocused,
    };
}