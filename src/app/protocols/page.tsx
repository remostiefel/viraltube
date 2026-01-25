"use client";

import { useState } from "react";
import { Search, Zap, AlertTriangle, Battery, Brain, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PROTOCOLS = [
    {
        id: "dopamine-crash",
        title: "Dopamine Rescue",
        symptoms: ["feeling empty", "doomscrolling", "numbness", "boredom"],
        icon: Battery,
        color: "text-red-500",
        border: "border-red-500/20",
        steps: ["Cold Water Face Splash (30s)", "No-Phone Zone (10m)", "Non-Sleep Deep Rest (NSDR)"]
    },
    {
        id: "anxiety-spike",
        title: "Cortisol Flush",
        symptoms: ["heart racing", "overwhelmed", "panic", "shallow breath"],
        icon: AlertTriangle,
        color: "text-orange-500",
        border: "border-orange-500/20",
        steps: ["Double Inhale, Long Exhale (x10)", "Panoramic Vision (Soften Gaze)", "Walk Forward (Optic Flow)"]
    },
    {
        id: "writers-block",
        title: "Creative Unblock",
        symptoms: ["stuck", "blank page", "cant start", "brain fog"],
        icon: Brain,
        color: "text-blue-500",
        border: "border-blue-500/20",
        steps: ["Change Physical Location", "Alpha Beat Audio (5m)", "Write Garbage (2m Timer)"]
    },
    {
        id: "energy-dip",
        title: "Adrenaline Spike",
        symptoms: ["sleepy", "afternoon slump", "tired"],
        icon: Flame,
        color: "text-yellow-500",
        border: "border-yellow-500/20",
        steps: ["Squats / Jumping Jacks (x20)", "Fast Breathwork (Hyperventilation)", "Bright Light Exposure"]
    },
    {
        id: "infinite-loop",
        title: "The Infinite Loop",
        symptoms: ["creative paradox", "meta-anxiety", "system overload", "lost in abstraction"],
        icon: Brain,
        color: "text-purple-500",
        border: "border-purple-500/20",
        steps: ["Watch Your Best Video (Reflection)", "Analyze the Analyzer (Scanner)", "Re-Inject Output as Input (Recursion)"]
    },
];

export default function ProtocolsPage() {
    const [query, setQuery] = useState("");
    const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

    const filteredProtocols = PROTOCOLS.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.symptoms.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-border/20 pb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                    MICRO-PROTOCOLS
                </h1>
                <p className="text-muted-foreground">Rapid-Response neuro-biological interventions for acute states.</p>
            </div>

            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="How do you feel? (e.g. 'Stuck', 'Anxious', 'Tired')..."
                    className="w-full bg-card/50 border border-border/50 text-xl p-6 pl-12 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProtocols.map((protocol) => {
                    const Icon = protocol.icon;
                    const isActive = activeProtocol === protocol.id;

                    return (
                        <div
                            key={protocol.id}
                            className={cn(
                                "group relative overflow-hidden bg-card/30 border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer",
                                isActive ? `${protocol.border} bg-card/60 ring-1 ring-${protocol.color.split('-')[1]}-500/50` : "border-border/30 hover:border-white/10"
                            )}
                            onClick={() => setActiveProtocol(isActive ? null : protocol.id)}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg bg-background/50", protocol.color)}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-none">{protocol.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {protocol.symptoms.slice(0, 2).join(", ")}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className={cn("w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1", isActive && "rotate-90")} />
                            </div>

                            {/* Active Steps (Expandable) */}
                            {isActive && (
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2">
                                    {protocol.steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-background/20 hover:bg-background/40 transition-colors">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-mono font-bold">{i + 1}</span>
                                            <span className="text-sm font-medium text-white/90">{step}</span>
                                        </div>
                                    ))}
                                    <button className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        EXECUTE NOW
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredProtocols.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                        No specific protocol found. Try "Tired" or "Stuck".
                    </div>
                )}
            </div>
        </div>
    );
}
