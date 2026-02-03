import { AlertTriangle, CheckCircle, Disc, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrafficLightProps {
    score: number; // 0-100
    label: string;
    reasoning?: string;
    isLoading?: boolean;
}

export function TrafficLightWidget({ score, label, reasoning, isLoading }: TrafficLightProps) {
    // Determine State
    let state: "RED" | "YELLOW" | "GREEN" = "RED";
    if (score >= 80) state = "GREEN";
    else if (score >= 50) state = "YELLOW";

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 backdrop-blur-sm">

            {/* The Light Signal */}
            <div className="flex flex-col gap-2 bg-black/50 p-2 rounded-full border border-white/5 shadow-inner">
                <div className={cn("w-3 h-3 rounded-full transition-all duration-500", state === "RED" ? "bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.6)]" : "bg-red-900/20")} />
                <div className={cn("w-3 h-3 rounded-full transition-all duration-500", state === "YELLOW" ? "bg-yellow-500 shadow-[0_0_10px_2px_rgba(234,179,8,0.6)]" : "bg-yellow-900/20")} />
                <div className={cn("w-3 h-3 rounded-full transition-all duration-500", state === "GREEN" ? "bg-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.6)]" : "bg-green-900/20")} />
            </div>

            {/* Analysis Text */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</h3>
                    {isLoading ? (
                        <span className="text-[10px] text-cyan-400 animate-pulse">ANALYZING...</span>
                    ) : (
                        <span className={cn(
                            "text-sm font-bold font-mono",
                            state === "GREEN" ? "text-green-400" : state === "YELLOW" ? "text-yellow-400" : "text-red-400"
                        )}>
                            {score}/100
                        </span>
                    )}
                </div>

                <p className={cn(
                    "text-xs leading-tight font-medium line-clamp-2",
                    isLoading ? "text-white/20" : "text-white/80"
                )}>
                    {reasoning || "Waiting for signal..."}
                </p>
            </div>

            {/* Icon Status */}
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                {state === "GREEN" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {state === "YELLOW" && <MinusCircle className="w-4 h-4 text-yellow-500" />}
                {state === "RED" && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
        </div>
    );
}
