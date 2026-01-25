"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Brain, Sparkles, Power, Zap, Play } from "lucide-react";
import Link from "next/link";

const DREAMS = [
    "Simulating viral hook variations for 'Dopamine Detox'...",
    "Re-calculating pacing algorithms based on new retention data...",
    "Dreaming of thumbnails: Contrast ratio optimization...",
    "Synthesizing new wisdom nuggets from recent scans...",
    "Connecting synapse: 'Sleep' <-> 'Productivity'...",
    "Optimizing cortical load for tomorrow's deep work...",
    "Running scenario: What if the intro was a question?...",
    "Running scenario: What if the intro was a shocking fact?...",
    "Analyzing competitor: 'Huberman Lab' pattern match...",
    "Defragging creative memory banks..."
];

export default function DreamMode() {
    const [isDreaming, setIsDreaming] = useState(false);
    const [dreamLog, setDreamLog] = useState<string[]>([]);
    const [dreamCount, setDreamCount] = useState(0);

    // Initial Start
    useEffect(() => {
        const timer = setTimeout(() => setIsDreaming(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Dreaming Loop
    useEffect(() => {
        if (!isDreaming) return;

        const interval = setInterval(() => {
            const newDream = DREAMS[Math.floor(Math.random() * DREAMS.length)];
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const logEntry = `[${time}] :: ${newDream}`;

            setDreamLog(prev => [logEntry, ...prev].slice(0, 8)); // Keep last 8 lines
            setDreamCount(prev => prev + 1);
        }, 1500);

        return () => clearInterval(interval);
    }, [isDreaming]);

    return (
        <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Theta Waves */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-indigo-500 blur-sm animate-pulse" />
                <div className="absolute top-1/2 left-0 w-full h-[100px] bg-gradient-to-b from-indigo-900/0 via-indigo-900/20 to-indigo-900/0 -translate-y-1/2" />
            </div>

            {/* Central interface */}
            <div className="relative z-10 w-full max-w-2xl text-center space-y-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse">
                        <Moon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-[0.5em] text-cyan-400 uppercase">Dream Mode <span className="text-xs align-top font-mono tracking-normal border border-red-500/30 bg-red-500/10 rounded px-1 ml-1 text-red-500">automated</span></h1>
                    <p className="text-xs text-indigo-400/60 uppercase tracking-widest">Subconscious Processing Active</p>
                </motion.div>

                {/* Dream Terminal */}
                <div className="h-64 bg-black/50 border border-indigo-500/30 rounded-lg p-6 text-left overflow-hidden relative shadow-2xl backdrop-blur-sm">
                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />

                    <div className="space-y-2 font-mono text-sm">
                        <AnimatePresence mode="popLayout">
                            {dreamLog.map((log, i) => (
                                <motion.div
                                    key={log + i} // Unique key hack
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-indigo-300"
                                >
                                    <span className="text-indigo-500 mr-2">➜</span>
                                    {log}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Cursor */}
                    {dreamLog.length === 0 && (
                        <div className="animate-pulse text-indigo-500">Initializing REM cycle...</div>
                    )}
                </div>

                {/* Processing Stats */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">{dreamCount}</div>
                        <div className="text-[10px] text-indigo-400 uppercase">Simulations</div>
                    </div>
                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">4.2<span className="text-sm">Hz</span></div>
                        <div className="text-[10px] text-indigo-400 uppercase">Theta Freq</div>
                    </div>
                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">98%</div>
                        <div className="text-[10px] text-indigo-400 uppercase">Efficiency</div>
                    </div>
                </div>

                {/* Wake Up Button */}
                <Link href="/">
                    <button className="mt-8 group relative px-8 py-3 bg-white text-black font-bold tracking-widest uppercase text-sm rounded-full hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-600" /> Wake Up
                        </span>
                    </button>
                </Link>

            </div>
        </div>
    );
}
