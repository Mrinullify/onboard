"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
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
    value: string;
    onChange: (value: string) => void;

    options: string[];

    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
};


export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyMessage = "Nothing found.",
}: SearchableSelectProps) {
    // LOCAL STATE
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // ADD CUSTOM
    const addNewOption = () => {
        const trimmed = search.trim();
        if (!trimmed) return;

        // if already selected
        const exists = options.includes(trimmed);

        if (exists) {
            setSearch("");
            setOpen(false);
            return;
        }

        // ADD IT
        onChange(search);
        setSearch("");
    };

    // CHECK IF SEARCH IS IN OPTIONS
    const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase()));


    return (
        <Popover open={open} onOpenChange={setOpen}>

            {/* TRIGGER */}
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value || placeholder}

                    <ChevronsUpDown className="opacity-50 h-4 w-4" />
                </Button>
            </PopoverTrigger>

            {/* CONTENT */}
            <PopoverContent className="w-[200px] p-0">
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
                        {/* Add custom topic  */}
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
                                {/* ITEMS */}
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                            onChange(option);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover >
    );
}