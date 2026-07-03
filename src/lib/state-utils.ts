import { Dispatch, SetStateAction } from "react";

/**
 * Generic utility to update a specific field in any object state
 * 
 * @param setState The React state setter function
 * @param field The key of the object you want to update
 * @param value The new value for that key
 */
export function updateObjectState<T, K extends keyof T>(
    setState: Dispatch<SetStateAction<T>>,
    field: K,
    value: T[K]
) {
    setState((prev) => ({
        ...prev,
        [field]: value,
    }));
}

/**
 * Generic utility to toggle a field's value in an object state.
 * If the current value equals the clicked value, it resets to the defaultValue.
 * 
 * @param setState The React state setter function
 * @param field The key of the object you want to update
 * @param value The clicked value
 * @param defaultValue The default value to reset to if toggled off
 */
export function toggleObjectState<T, K extends keyof T>(
    setState: Dispatch<SetStateAction<T>>,
    field: K,
    value: T[K],
    defaultValue: T[K]
) {
    setState((prev) => ({
        ...prev,
        [field]: prev[field] === value ? defaultValue : value,
    }));
}
