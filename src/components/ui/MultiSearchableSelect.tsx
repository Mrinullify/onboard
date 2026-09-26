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
            <div className="bg-card border border-border/80 rounded-2xl p-5">

                {/* TITLE */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Select Topics
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Search and choose skills for your assessment
                    </p>
                </div>

                {/* SEARCH BAR */}
                <div className="mb-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        {/* TRIGGER */}
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between bg-background border-border/80"
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
                                <div className="border-b border-border/80 px-3 py-2">
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
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
                    <div className="w-full border border-dashed border-border rounded-xl p-4 bg-background min-h-[80px]">

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-foreground">
                                Selected Topics
                            </h3>

                            <span className="text-xs text-muted-foreground">
                                Click to remove
                            </span>
                        </div>

                        {/* CHIPS AREA */}
                        <div className="flex flex-wrap gap-2">
                            {
                                value.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No topics selected yet
                                    </p>

                                ) : (
                                    value.map((chip) => (
                                        <span key={chip} onClick={() => toggleOption(chip)} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full cursor-pointer hover:bg-primary/20 transition">
                                            {chip} ✕
                                        </span>

                                    ))
                                )
                            }
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}