"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Brain,
    Activity,
    ArrowRight,
    CheckCircle2,
    Play
} from "lucide-react";
import { StrategyProfile } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { navigation, GROUP_COLORS, NavItem } from "@/config/navigation";
import { getProjectsAction } from "@/app/actions";
import { Project } from "@/lib/projects";

export default function Dashboard() {
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("nc_cortex_profile");
        if (saved) {
            setCortexProfile(JSON.parse(saved));
        }
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const data = await getProjectsAction();
        setProjects(data.slice(0, 5)); // Show top 5
    };

    // ... (rest of component)


    // Group items excluding Dashboard itself
    const groups = navigation.reduce((acc, item) => {
        if (item.group === "DASHBOARD") return acc;
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    return (
        <div className="space-y-4 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        Mission Control
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        System Overview & Quick Actions
                    </p>
                </div>

                {/* Cortex Status Badge */}
                <Link href="/cortex" className="group">
                    <div className="flex items-center gap-3 bg-card border border-border/50 px-4 py-2 rounded-full hover:border-primary/50 transition-colors cursor-pointer">
                        <div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">Cortex Strategy</div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    cortexProfile ? "bg-green-500" : "bg-red-500 animate-pulse"
                                )} />
                                {cortexProfile ? cortexProfile.tone.toUpperCase() : "UNCALIBRATED"}
                            </div>
                        </div>
                        <Brain className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: System Overview (Modules) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Render each Group Section */}
                    {Object.entries(groups).map(([groupName, items]) => {
                        const groupColor = GROUP_COLORS[groupName] || "var(--foreground)";
                        return (
                            <div key={groupName} className="space-y-4">
                                <h3
                                    className="font-bold text-lg uppercase tracking-wider flex items-center gap-2"
                                    style={{ color: groupColor }}
                                >
                                    {groupName}
                                    <div className="h-px flex-1 bg-border/30 ml-4 group-color-border" style={{ backgroundColor: `color-mix(in srgb, ${groupColor} 20%, transparent)` }} />
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                                    {items.map((item) => (
                                        <Link key={item.name} href={item.href} className="group block h-full">
                                            <div
                                                className="aspect-square bg-card/50 border border-border/40 p-3 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden flex flex-col justify-between"
                                                style={{
                                                    // Dynamic border color on hover
                                                }}
                                            >
                                                {/* Hover Glow Effect */}
                                                <div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                                                    style={{ background: `linear-gradient(45deg, ${groupColor}, transparent)` }}
                                                />

                                                <div className="flex justify-between items-start z-10">
                                                    <div className="p-2.5 rounded-lg bg-background/50 text-muted-foreground group-hover:text-foreground transition-colors mix-blend-luminosity group-hover:mix-blend-normal">
                                                        <item.icon className="w-7 h-7" style={{ color: groupColor }} />
                                                    </div>
                                                    <ArrowRight
                                                        className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100"
                                                        style={{ color: groupColor }}
                                                    />
                                                </div>

                                                <div className="z-10">
                                                    <h4 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground leading-tight line-clamp-2 opacity-90">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                </div>

                {/* RIGHT: Notifications & Info */}
                <div className="space-y-4">
                    <h3 className="font-bold text-base text-muted-foreground uppercase tracking-wider">System State</h3>

                    <div className="bg-card border border-border/40 rounded-xl p-4 space-y-4 sticky top-6">
                        <div>
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-primary" /> Active Strategy
                            </h4>
                            {cortexProfile ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                                        <span className="text-muted-foreground">Tone</span>
                                        <span className="font-mono font-bold">{cortexProfile.tone.toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                                        <span className="text-muted-foreground">Niche</span>
                                        <span className="font-mono font-bold truncate max-w-[150px]">{cortexProfile.niche}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                                        <span className="text-muted-foreground">Mode</span>
                                        <span className="font-mono font-bold">{cortexProfile.emulationMode.toUpperCase()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Link href="/cortex" className="text-primary hover:underline text-sm font-bold">
                                        Initialize Cortex Now
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-border/40" />

                        <div>
                            <h4 className="font-bold flex items-center gap-2 mb-4">
                                <Play className="w-4 h-4 text-green-500" /> Recent Projects
                            </h4>
                            <div className="space-y-4">
                                {projects.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No projects yet.</p>
                                )}
                                {projects.map((p) => (
                                    <div key={p.id} className="flex gap-3 items-start group cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors" title={p.id}>
                                        <CheckCircle2 className={cn("w-4 h-4 mt-0.5", p.status === "done" ? "text-green-500" : "text-yellow-500")} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold line-clamp-1">{p.title}</div>
                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                <span className="uppercase text-[10px] bg-muted px-1 rounded">{p.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
