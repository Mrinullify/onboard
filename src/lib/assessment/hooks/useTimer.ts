import { useEffect, useState } from "react";

interface UseTimerOptions {
    durationSeconds: number;
    onTimeUp?: () => void;
    storageKey: string;
}

export function useTimer({
    durationSeconds,
    onTimeUp,
    storageKey,
}: UseTimerOptions) {

    // remaining seconds
    const [timeLeft, setTimeLeft] = useState(() => {
        if (typeof window === "undefined") {
            return durationSeconds;
        }

        const savedTime = localStorage.getItem(storageKey);

        if (!savedTime) {
            const endTime = Date.now() + durationSeconds * 1000;
            localStorage.setItem(storageKey, endTime.toString());
            return durationSeconds;
        }

        const endTime = parseInt(savedTime);

        return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    });

    // check local storage for saved time and manage interval
    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    localStorage.removeItem(storageKey);
                    onTimeUp?.();
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [storageKey, onTimeUp]);

    // convert to MM:SS
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return {
        timeLeft,
        formattedTime,
    };
}