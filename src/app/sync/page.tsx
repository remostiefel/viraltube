"use client";

import { useState } from "react";
import { ArrowLeft, Play, Pause, Volume2, Waves, Zap, Mic2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import BioluminescentFlow from "@/components/dashboard/BioluminescentFlow";

const FREQUENCIES = [
    { id: "ALPHA", label: "Alpha (8-12Hz)", desc: "Calm Focus", color: "bg-purple-500", icon: Waves },
    { id: "THETA", label: "Theta (4-8Hz)", desc: "Deep Crea", color: "bg-teal-500", icon: Mic2 },
    { id: "GAMMA", label: "Gamma (40Hz)", desc: "High Proc", color: "bg-yellow-500", icon: Zap },
];

export default function NeuroSyncPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedFreq, setSelectedFreq] = useState("ALPHA");
    const [volume, setVolume] = useState(50);

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Background Visualizer */}
            <BioluminescentFlow active={isPlaying} frequency={selectedFreq} />

            {/* Content Overlay */}
            <div className="relative z-10 flex-1 flex flex-col p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Exit Sync</span>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-muted-foreground">{isPlaying ? "SIGNAL ACTIVE" : "SIGNAL OFFLINE"}</span>
                    </div>
                </div>

                {/* Main Player Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-12">

                    {/* Frequency Selector */}
                    <div className="flex gap-4">
                        {FREQUENCIES.map((freq) => {
                            const isSelected = selectedFreq === freq.id;
                            const Icon = freq.icon;
                            return (
                                <button
                                    key={freq.id}
                                    onClick={() => setSelectedFreq(freq.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-6 rounded-2xl border transition-all duration-300 w-32",
                                        isSelected
                                            ? "bg-black/60 border-white/20 shadow-xl scale-110 backdrop-blur-xl"
                                            : "bg-black/20 border-transparent hover:bg-black/40 text-muted-foreground"
                                    )}
                                >
                                    <div className={cn("p-3 rounded-full bg-white/5", isSelected && `${freq.color} text-black`)}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <div className={cn("font-bold text-sm", isSelected ? "text-white" : "text-muted-foreground")}>{freq.id}</div>
                                        <div className="text-[10px] uppercase opacity-60 font-medium">{freq.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Play/Pause Main Control */}
                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 group relative",
                                isPlaying
                                    ? "bg-white text-black border-transparent shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                                    : "bg-transparent border-white/20 text-white hover:border-white/50 hover:scale-105"
                            )}
                        >
                            {isPlaying ? (
                                <Pause className="w-10 h-10 fill-current" />
                            ) : (
                                <Play className="w-10 h-10 fill-current ml-1" />
                            )}

                            {/* Ripple Effect Ring */}
                            {isPlaying && (
                                <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-50" />
                            )}
                        </button>

                        <div className="text-center space-y-1">
                            <div className="text-3xl font-mono text-white font-light tracking-[0.2em]">00:14:23</div>
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Session Duration</div>
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="max-w-md mx-auto w-full bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                    <span className="text-xs font-mono w-8 text-right text-muted-foreground">{volume}%</span>
                </div>

            </div>
        </div>
    );
}
