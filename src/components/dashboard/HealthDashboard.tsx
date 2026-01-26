"use client";

import { Activity, Battery, BatteryMedium, BatteryWarning, CheckCircle, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricHealthProps {
    label: string;
    value: string;
    score: number; // 1-10 (10 = Green, 1 = Red)
    trend: "up" | "down" | "flat";
    tooltip: string;
}

function TrafficLight({ score }: { score: number }) {
    if (score >= 8) return <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />;
    if (score >= 5) return <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />;
    return <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />;
}

export function MetricHealthCard({ label, value, score, trend, tooltip }: MetricHealthProps) {
    return (
        <div className="bg-card/40 border border-border/50 rounded-xl p-4 flex items-center justify-between hover:bg-card/60 transition-colors group relative">
            <div className="flex items-center gap-3">
                <TrafficLight score={score} />
                <div>
                    <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
                    <div className="text-lg font-bold font-mono">{value}</div>
                </div>
            </div>

            {/* Trend Indicator */}
            <div className={cn(
                "p-2 rounded-lg",
                trend === "up" ? "text-green-500 bg-green-500/10" :
                    trend === "down" ? "text-red-500 bg-red-500/10" : "text-yellow-500 bg-yellow-500/10"
            )}>
                {trend === "up" ? <TrendingUp className="w-4 h-4" /> :
                    trend === "down" ? <TrendingDown className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>

            {/* Context Tooltip (Visible on Hover) */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded-lg border shadow-xl bottom-full left-0 mb-2 w-48 pointer-events-none z-10">
                {tooltip}
            </div>
        </div>
    );
}

export function HealthDashboard({ satisfactionScore, grade, qcrStatus, zombieRatio }: {
    satisfactionScore: number,
    grade: string,
    qcrStatus: "Good" | "Bad" | "Neutral",
    zombieRatio: number
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Channel Pulse
                </h3>
                <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border",
                    grade === "S" || grade === "A" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        grade === "F" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                )}>
                    Grade: {grade}
                </div>
            </div>

            <div className="grid gap-3">
                <MetricHealthCard
                    label="Satisfaction Score"
                    value={`${satisfactionScore}/100`}
                    score={satisfactionScore / 10}
                    trend={satisfactionScore > 70 ? "up" : "down"}
                    tooltip="Combined CORTEX Score based on Delight, Retention, and Click Quality."
                />

                <MetricHealthCard
                    label="Click Quality"
                    value={qcrStatus}
                    score={qcrStatus === "Good" ? 10 : qcrStatus === "Bad" ? 2 : 5}
                    trend={qcrStatus === "Good" ? "up" : "down"}
                    tooltip={qcrStatus === "Bad" ? "Warning: High Clickbait detected (High CTR, Low Duration)." : "Healthy Click-to-Value ratio."}
                />

                <MetricHealthCard
                    label="Subscriber Vitality"
                    value={`${(zombieRatio * 100).toFixed(1)}% Active`}
                    score={zombieRatio > 0.1 ? 9 : zombieRatio < 0.05 ? 3 : 6}
                    trend={zombieRatio > 0.1 ? "up" : "down"}
                    tooltip={zombieRatio < 0.05 ? "CRITICAL: 'Zombie Sub' risk. Views < 5% of Subs." : "Healthy subscriber activity."}
                />
            </div>
        </div>
    );
}
