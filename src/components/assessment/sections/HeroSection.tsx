"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Bot } from "lucide-react";

export default function HeroSection() {
    return (
        <Card className="border border-border/80 bg-gradient-to-br from-card via-secondary/40 to-accent/20 shadow-none">
            <CardContent className="p-5 space-y-4">

                {/* Badges */}
                <div className="flex items-center gap-2">
                    <Badge className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Powered
                    </Badge>

                    <Badge variant="outline" className="flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" />
                        Assessment Simulator
                    </Badge>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Build Your AI Assessment
                </h1>

                {/* Description */}
                <p className="text-muted-foreground max-w-2xl leading-relaxed">
                    Customize your assessment experience by selecting role, difficulty,
                    topics, and format. Our AI will simulate real-world assessment scenarios
                    tailored to your goals.
                </p>

                {/* Optional hint / divider */}
                <Separator className="mt-2" />

                {/* Small hint text */}
                <p className="text-xs text-muted-foreground">
                    Tip: Choose <span className="text-foreground font-medium">Mixed</span> for the most realistic experience.
                </p>

            </CardContent>
        </Card>
    );
}
