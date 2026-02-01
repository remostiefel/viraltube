"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Trophy,
    ArrowLeft,
    Zap,
    Users,
    Eye,
    Target,
    Crown,
    Medal,
    Star,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchChannelInsights, getProjectsAction, getTemplatesAction } from "@/app/actions";
import { ChannelData } from "@/lib/youtube";
import { MILESTONES, Milestone } from "@/lib/milestones";

export default function HallOfVisions() {
    const [channelData, setChannelData] = useState<ChannelData | null>(null);
    const [stats, setStats] = useState({ projects: 0, wisdom: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Parallel fetching
                const [cData, projs, templates] = await Promise.all([
                    fetchChannelInsights(),
                    getProjectsAction(),
                    getTemplatesAction("viral-wisdom")
                ]);

                setChannelData(cData);
                setStats({
                    projects: projs.length,
                    wisdom: templates.length
                });

            } catch (error) {
                console.error("Failed to load milestone data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Helpers
    const isUnlocked = (m: Milestone) => {
        if (loading) return false;
        if (m.type === "subs") return Number(channelData?.statistics?.subscriberCount || 0) >= m.threshold;
        if (m.type === "views") return Number(channelData?.statistics?.viewCount || 0) >= m.threshold;
        if (m.type === "projects") return stats.projects >= m.threshold;
        if (m.type === "wisdom") return stats.wisdom >= m.threshold;
        return false;
    };

    const getProgress = (m: Milestone): number => {
        if (loading) return 0;
        let current = 0;
        if (m.type === "subs") current = Number(channelData?.statistics?.subscriberCount || 0);
        else if (m.type === "views") current = Number(channelData?.statistics?.viewCount || 0);
        else if (m.type === "projects") current = stats.projects;
        else if (m.type === "wisdom") current = stats.wisdom;

        return Math.min(100, (current / m.threshold) * 100);
    };

    // Grouping
    const channelSection = MILESTONES.filter(m => m.type === "subs" || m.type === "views");
    const neuroSection = MILESTONES.filter(m => m.type === "projects" || m.type === "wisdom");

    // Next Big Goal Logic
    const getNextGoal = (section: Milestone[]) => {
        return section.find(m => !isUnlocked(m)) || null;
    };

    const nextChannelGoal = getNextGoal(channelSection);
    const nextNeuroGoal = getNextGoal(neuroSection);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Header */}
            <div className="border-b border-border/20 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-[#fbbf24] flex items-center gap-2">
                                <Trophy className="w-6 h-6" /> HALL OF VISIONS
                            </h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">
                                Achievements & Milestones
                            </p>
                        </div>
                    </div>
                    {channelData && (
                        <div className="flex gap-6 text-sm">
                            <div className="text-right">
                                <div className="text-xs text-cyan-400 uppercase font-bold">Subs</div>
                                <div className="font-mono font-bold">{Number(channelData.statistics.subscriberCount).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-cyan-400 uppercase font-bold">Views</div>
                                <div className="font-mono font-bold">{Number(channelData.statistics.viewCount).toLocaleString()}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">

                {/* 1. CHANNEL AUTHORITY SECTION */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold border-l-4 border-[#38BDF8] pl-3">Channel Authority</h2>
                        {nextChannelGoal && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                Next Goal: <span className="text-white font-bold">{nextChannelGoal.title}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {channelSection.map(m => {
                            const unlocked = isUnlocked(m);
                            const progress = getProgress(m);

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "relative overflow-hidden rounded-xl border p-6 transition-all duration-500",
                                        unlocked
                                            ? "bg-gradient-to-br from-card to-[#38BDF8]/5 border-[#38BDF8]/30 shadow-[0_0_20px_-10px_rgba(56,189,248,0.3)]"
                                            : "bg-muted/10 border-white/5 opacity-60"
                                    )}
                                >
                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col items-center text-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                                            unlocked ? "bg-[#38BDF8]/10 text-[#38BDF8]" : "bg-muted text-muted-foreground"
                                        )}>
                                            <m.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg leading-none">{m.title}</h3>
                                        <p className="text-xs text-white/60">{m.description}</p>

                                        {!unlocked && (
                                            <div className="w-full mt-2 space-y-1">
                                                <div className="flex justify-between text-[10px] text-white/70 uppercase font-bold">
                                                    <span>Progress</span>
                                                    <span>{Math.floor(progress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-muted-foreground/50 transition-all duration-1000"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {unlocked && (
                                            <div className="mt-2 px-3 py-1 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Achieved
                                            </div>
                                        )}
                                    </div>

                                    {/* Lock Overlay */}
                                    {!unlocked && (
                                        <div className="absolute top-2 right-2 text-muted-foreground/30">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 2. NEURO-EVOLUTION SECTION */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold border-l-4 border-[#A855F7] pl-3">Neuro-Evolution (Skills)</h2>
                        {nextNeuroGoal && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                Next Goal: <span className="text-white font-bold">{nextNeuroGoal.title}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {neuroSection.map(m => {
                            const unlocked = isUnlocked(m);
                            const progress = getProgress(m);

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "relative overflow-hidden rounded-xl border p-6 transition-all duration-500",
                                        unlocked
                                            ? "bg-gradient-to-br from-card to-[#A855F7]/5 border-[#A855F7]/30 shadow-[0_0_20px_-10px_rgba(168,85,247,0.3)]"
                                            : "bg-muted/10 border-white/5 opacity-60"
                                    )}
                                >
                                    <div className="relative z-10 flex flex-col items-center text-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                                            unlocked ? "bg-[#A855F7]/10 text-[#A855F7]" : "bg-muted text-muted-foreground"
                                        )}>
                                            <m.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg leading-none">{m.title}</h3>
                                        <p className="text-xs text-muted-foreground">{m.description}</p>

                                        {!unlocked && (
                                            <div className="w-full mt-2 space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                                    <span>Progress</span>
                                                    <span>{Math.floor(progress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-muted-foreground/50 transition-all duration-1000"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {unlocked && (
                                            <div className="mt-2 px-3 py-1 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded text-[10px] font-bold text-[#A855F7] uppercase tracking-wider flex items-center gap-1">
                                                <Medal className="w-3 h-3 fill-current" /> Mastery
                                            </div>
                                        )}
                                    </div>

                                    {/* Lock Overlay */}
                                    {!unlocked && (
                                        <div className="absolute top-2 right-2 text-muted-foreground/30">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Motivational Quote */}
                <div className="text-center py-12 border-t border-border/20">
                    <p className="font-serif italic text-xl text-white">
                        "The goal is not to be successful, but to be of value."
                    </p>
                    <p className="text-xs uppercase font-bold text-muted-foreground mt-2">— Albert Einstein</p>
                </div>

            </div>
        </div>
    );
}
