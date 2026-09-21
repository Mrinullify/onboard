"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// TYPE
export type SearchableSelectProps = {
    value: string[];
    onChange: (value: string[]) => void;
    options: string[];

    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
};

export default function MultiSearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Select topics...",
    searchPlaceholder = "Search...",
    emptyMessage = "Nothing found.",
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // TOGGLE LOGIC
    const toggleOption = (option: string) => {
        const exists = value.includes(option);

        const newValue = exists
            ? value.filter((item) => item !== option)
            : [...value, option];

        onChange(newValue);
    };

    // ADD CUSTOM
    const addNewOption = () => {
        const trimmed = search.trim();
        if (!trimmed) return;

        // if already selected
        const exists = value.some(
            (topic) => topic.toLowerCase() === trimmed.toLowerCase()
        );

        if (exists) {
            setSearch("");
            setOpen(false);
            return;
        }

        // ADD IT
        onChange([...value, trimmed]);
        setSearch("");
    };

    // CHECK IF SEARCH IS IN OPTIONS
    const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase()));

    return (

        <div className="w-full mx-auto mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">

                {/* TITLE */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Select Topics
                    </h2>
                    <p className="text-sm text-gray-500">
                        Search and choose skills for your assessment
                    </p>
                </div>

                {/* SEARCH BAR GOES HERE */}
                <div className="mb-4">
                    {/* 👇 paste your SearchableSelect / input here */}
                    <Popover open={open} onOpenChange={setOpen}>
                        {/* TRIGGER */}
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {value.length > 0
                                    ? value.join(", ")
                                    : placeholder}
                                <ChevronsUpDown className="opacity-50 h-4 w-4" />
                            </Button>
                        </PopoverTrigger>

                        {/* CONTENT */}
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <div className="border-b px-3 py-2">
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full bg-transparent outline-none text-sm"
                                    />
                                </div>
                                <CommandList>
                                    {/* Add custom topic */}
                                    {filteredOptions.length === 0 ? (
                                        search.trim() !== "" ? (
                                            <CommandItem
                                                onSelect={() => {
                                                    addNewOption();
                                                }}
                                            >
                                                {`➕ Add "${search.trim()}"`}
                                            </CommandItem>
                                        ) : (
                                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                                        )

                                    ) : (
                                        <CommandGroup>
                                            {filteredOptions.map((option) => {
                                                const isSelected = value.includes(option);

                                                return (
                                                    <CommandItem
                                                        key={option}
                                                        value={option}
                                                        onSelect={() => toggleOption(option)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {option}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>

                                    )}

                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* SELECTED AREA CARD (chips will appear here) */}
                <div className="mt-4">
                    {/* 👇 second component goes here */}
                    <div className="w-full border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[80px]">

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">
                                Selected Topics
                            </h3>

                            <span className="text-xs text-gray-400">
                                Click to remove
                            </span>
                        </div>

                        {/* CHIPS AREA */}
                        <div className="flex flex-wrap gap-2">
                            {/* Example chip (you will map this) */}
                            {
                                value.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No topics selected yet
                                    </p>

                                ) : (
                                    value.map((chip) => (
                                        <span key={chip} onClick={() => toggleOption(chip)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-sm cursor-pointer hover:bg-blue-600 transition">
                                            {chip} ✕
                                        </span>

                                    ))
                                )
                            }
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}