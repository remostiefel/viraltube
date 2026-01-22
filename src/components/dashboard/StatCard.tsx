import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, LucideIcon, Minus } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
    icon: LucideIcon;
    description: string;
    className?: string;
}

export function StatCard({ title, value, change, trend, icon: Icon, description, className }: StatCardProps) {
    return (
        <div className={cn("bg-card border border-border/40 rounded-xl p-6 relative overflow-hidden group", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-primary/10 rounded-lg text-primary ring-1 ring-primary/20">
                    <Icon className="w-5 h-5" />
                </div>
                {change && (
                    <div className={cn(
                        "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                        trend === "up" ? "bg-green-500/10 text-green-500" :
                            trend === "down" ? "bg-red-500/10 text-red-500" :
                                "bg-muted text-muted-foreground"
                    )}>
                        {trend === "up" && <ArrowUp className="w-3 h-3 mr-1" />}
                        {trend === "down" && <ArrowDown className="w-3 h-3 mr-1" />}
                        {trend === "neutral" && <Minus className="w-3 h-3 mr-1" />}
                        {change}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </div>
        </div>
    );
}
