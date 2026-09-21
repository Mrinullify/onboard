import { useEffect, useState } from "react";

interface UseFullscreenOptions {
    onExit?: () => void;
    onEnter?: () => void;
}

export function useFullscreen(options?: UseFullscreenOptions) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // enter fullscreen
    async function enterFullscreen() {
        await document.documentElement.requestFullscreen();
    }

    // exit fullscreen
    async function exitFullscreen() {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    }

    // listen for fullscreen changes
    useEffect(() => {
        function handleFullscreenChange() {
            const fullscreen = !!document.fullscreenElement;

            setIsFullscreen(fullscreen);

            if (fullscreen) {
                options?.onEnter?.();
            } else {
                options?.onExit?.();
            }
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [options]);

    return {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
    };
}