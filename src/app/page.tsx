"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Activity,
    ArrowRight,
    Zap,
    Play,
    Scan,
    PenTool,
    Film,
    MonitorPlay,
    Timer,
    Flame,
    Moon
} from "lucide-react";
import { StrategyProfile } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { getProjectsAction } from "@/app/actions";
import { Project } from "@/lib/projects";
import GlassBrain from "@/components/dashboard/GlassBrain";

export default function NeuralInterface() {
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [systemState, setSystemState] = useState<"IDLE" | "ACTIVE" | "OPTIMIZED">("IDLE");

    useEffect(() => {
        const savedProfile = localStorage.getItem("nc_cortex_profile");
        const savedState = localStorage.getItem("nc_system_state");

        if (savedProfile) {
            setCortexProfile(JSON.parse(savedProfile));
        }

        if (savedState === "OPTIMIZED" || savedState === "ACTIVE") {
            setSystemState(savedState as "ACTIVE" | "OPTIMIZED");
        } else if (savedProfile) {
            setSystemState("ACTIVE");
        }

        loadProjects();
    }, []);

    const loadProjects = async () => {
        const data = await getProjectsAction();
        setProjects(data.slice(0, 3));
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">

            {/* Header / Top Bar */}
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-cyan-400 font-mono">NEURO-CODE <span className="text-xs align-top font-mono border border-red-500/30 bg-red-500/10 rounded px-1 ml-1 text-red-500">automated</span></h1>
                            <Link href="/dream" title="Enter Dream Mode (Sleep)">
                                <button className="p-1 hover:bg-white/10 rounded-full transition-colors group">
                                    <Moon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                                </button>
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase">Biological Recalibration System</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-card/50 border border-border/40 px-4 py-2 rounded-lg flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Rank</span>
                        <span className="text-sm font-bold text-white">INITIAND</span>
                    </div>
                    <Link href="/cortex" className="group">
                        <div className="bg-card/50 border border-border/40 px-4 py-2 rounded-lg flex flex-col items-end hover:border-primary/50 transition-colors cursor-pointer">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Strategy</span>
                            <span className={cn("text-sm font-bold", cortexProfile ? "text-primary" : "text-yellow-500")}>
                                {cortexProfile ? cortexProfile.tone.toUpperCase() : "UNCALIBRATED"}
                            </span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* MAIN COMMAND DECK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* LEFT: BIO-OS (Optimization) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-2 border-l-2 border-teal-500">
                        Step 1: Bio-Optimization
                    </h3>

                    {/* The Upgrade (Main Module) */}
                    <Link href="/upgrade" className="flex-1">
                        <div className="h-full bg-gradient-to-br from-teal-900/20 to-black border border-teal-500/30 rounded-2xl p-6 relative group overflow-hidden transition-all hover:border-teal-500/60 hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.2)]">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Zap className="w-8 h-8 text-teal-500" />
                            </div>
                            <div className="flex flex-col justify-end h-full relative z-10">
                                <h2 className="text-2xl font-bold text-teal-100 mb-1 font-mono">THE UPGRADE</h2>
                                <p className="text-sm text-teal-400/60 mb-4">15min Guided Neuro-Priming</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider bg-teal-500/10 px-3 py-2 rounded w-fit group-hover:bg-teal-500 group-hover:text-black transition-colors">
                                    <Play className="w-3 h-3 fill-current" /> Start Protocol
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Neuro-Sync */}
                    <Link href="/sync" className="h-[140px]">
                        <div className="h-full bg-card/30 border border-border/30 rounded-2xl p-5 relative group overflow-hidden hover:bg-card/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <Timer className="w-5 h-5 text-purple-400" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Audio Tool</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Neuro-Sync</h3>
                            <p className="text-xs text-muted-foreground">Binaural 40Hz Flow State</p>
                        </div>
                    </Link>
                </div>

                {/* CENTER: VISUALIZER (Glass Brain) */}
                <div className="lg:col-span-6">
                    <GlassBrain state={systemState} />

                    {/* Quick Stats below brain */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-card/20 border border-border/20 rounded-xl p-4 flex items-center gap-4">
                            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white leading-none">3</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Streak Days</div>
                            </div>
                        </div>
                        <div className="bg-card/20 border border-border/20 rounded-xl p-4 flex items-center gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white leading-none">12</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PRODUCTION CORTEX (Tools) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-2 border-l-2 border-primary">
                        Step 2: Production
                    </h3>

                    {/* Scanner */}
                    <Link href="/scanner" className="flex-1">
                        <div className="h-full bg-card/30 border border-border/30 rounded-2xl p-5 relative group hover:border-blue-500/50 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Scan className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Scanner</h3>
                                <p className="text-xs text-muted-foreground">Trend Scout & Wisdom Extraction</p>
                            </div>
                        </div>
                    </Link>

                    {/* Script Forge (Architect) */}
                    <Link href="/architect?tab=script" className="flex-1">
                        <div className="h-full bg-card/30 border border-border/30 rounded-2xl p-5 relative group hover:border-purple-500/50 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <PenTool className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Script Forge</h3>
                                <p className="text-xs text-muted-foreground">Voiceover & Script Architecture</p>
                            </div>
                        </div>
                    </Link>

                    {/* Director */}
                    <Link href="/architect?tab=director" className="flex-1">
                        <div className="h-full bg-card/30 border border-border/30 rounded-2xl p-5 relative group hover:border-pink-500/50 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                                    <Film className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Director</h3>
                                <p className="text-xs text-muted-foreground">Scene Prompts & Visualization</p>
                            </div>
                        </div>
                    </Link>

                </div>
            </div>

            {/* Recents Footer */}
            <div className="mt-8 pt-8 border-t border-border/20">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4" /> Active Projects
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {projects.length === 0 && (
                        <div className="text-sm text-muted-foreground italic col-span-3 text-center py-4 bg-card/20 rounded-xl">
                            No active projects. Start extraction in Scanner.
                        </div>
                    )}
                    {projects.map((p) => (
                        <Link key={p.id} href={`/project/${p.id}`}>
                            <div className="bg-card/30 border border-border/20 p-4 rounded-xl hover:bg-card/50 transition-colors flex items-center gap-4 group">
                                <div className={cn("w-2 h-2 rounded-full", p.status === "done" ? "bg-green-500" : "bg-yellow-500")} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{p.title}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">{p.status} • {new Date(p.createdAt).toLocaleDateString()}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}

