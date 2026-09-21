"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCardIcon, Flame, LogOutIcon, SettingsIcon, User, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import Logo from "@/components/shared/Logo";

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { handleSignOut } from "@/app/(auth)/logout/logout";

const navLinks = [
    {
        name: "Resume",
        href: "/resume",
    },
    {
        name: "Career Agent",
        href: "/career-agent",
    },
    {
        name: "Assessment",
        href: "/assessment",
    },
    {
        name: "Reports",
        href: "/reports",
    },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <header
            className="
            sticky top-0 z-50
            border-b
            bg-background/60
            backdrop-blur-xl
            "
        >
            <div
                className="
                mx-auto
                flex
                h-16
                max-w-7xl
                items-center
                justify-between
                px-6
                "
            >
                {/* LEFT */}
                <div className="flex items-center gap-10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3"
                    >
                        <Logo />
                    </Link>

                    {/* CENTER NAV */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => {
                            const active =
                                pathname === link.href ||
                                pathname.startsWith(`${link.href}/`);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="
                                    relative
                                    text-sm
                                    font-bold
                                    "
                                >
                                    {link.name}

                                    {active && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="
                                            absolute
                                            -bottom-5
                                            left-0
                                            h-[2px]
                                            w-full
                                            bg-primary
                                            "
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    {/* STREAK */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-3
                        py-1.5
                        text-sm
                        font-medium
                        "
                    >
                        <Flame className="h-4 w-4" />
                        <span>7 Day Streak</span>
                    </motion.div>

                    {/* NOTIFICATION */}
                    <button
                        className="
                        rounded-full
                        border
                        p-2
                        transition-colors
                        hover:bg-muted
                        "
                    >
                        <Bell className="h-5 w-5" />
                    </button>



                    {/* PROFILE */}
                    {/* ----------------------------- */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-3
                        py-1.5
                        transition-colors
                        hover:bg-muted
                        "
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:block">
                                    Mrinal
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <UserIcon />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCardIcon />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <SettingsIcon />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Button onClick={handleSignOut} className="w-full" variant={"destructive"}>
                                    <LogOutIcon />
                                    Log out

                                </Button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* ----------------------------- */}

                </div>
            </div>
        </header>
    );
}