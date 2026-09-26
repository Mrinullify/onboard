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
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* LEFT */}
                <div className="flex items-center gap-8 lg:gap-10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <Logo />
                    </Link>

                    {/* CENTER NAV */}
                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navLinks.map((link) => {
                            const active =
                                pathname === link.href ||
                                pathname.startsWith(`${link.href}/`);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative py-1 text-sm transition-colors ${
                                        active
                                            ? "font-semibold text-foreground"
                                            : "font-medium text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {link.name}

                                    {active && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute -bottom-[21px] left-0 h-[2px] w-full bg-primary"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-3">
                    {/* STREAK */}
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground/90">
                        <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                        <span>7 Day Streak</span>
                    </div>

                    {/* NOTIFICATION */}
                    <button
                        aria-label="Notifications"
                        className="rounded-lg border border-border/80 bg-card p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <Bell className="h-4 w-4" />
                    </button>

                    {/* PROFILE */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 rounded-full border-border/80 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                            >
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <User className="h-3.5 w-3.5" />
                                </div>
                                <span className="hidden sm:block">Account</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-md border-border/80">
                            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-normal">
                                My Account
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/resume" className="flex items-center gap-2 cursor-pointer">
                                    <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Resume Workspace</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/career-agent" className="flex items-center gap-2 cursor-pointer">
                                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Career Agent</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem asChild>
                                <button
                                    onClick={handleSignOut}
                                    className="flex w-full items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <LogOutIcon className="h-4 w-4" />
                                    <span>Log out</span>
                                </button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}