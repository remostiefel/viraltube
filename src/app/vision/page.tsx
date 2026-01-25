"use client";

import { useState, useRef } from "react";
import VisionCore, { CoreMode } from "@/components/vision/VisionCore";
import IdeaStream from "@/components/vision/IdeaStream";
import ViralPredictor from "@/components/vision/ViralPredictor";
import { SYSTEM_LOGS } from "@/components/vision/mockData";
import { Play, Pause, RefreshCw, Cpu, Share2, Lock, Smartphone, Zap, Globe, Wand2, Keyboard, Scissors, Monitor, FlaskConical, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VirtVisionPage() {
    const [mode, setMode] = useState<CoreMode>('idle');
    const [filmMode, setFilmMode] = useState(false);
    const [cinemaMode, setCinemaMode] = useState(false); // 16:9 Cinema Mode
    const [logs, setLogs] = useState<string[]>([]);
    const logIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to clear interval safely
    const clearLogInterval = () => {
        if (logIntervalRef.current) {
            clearInterval(logIntervalRef.current);
            logIntervalRef.current = null;
        }
    };

    const isSimulating = mode !== 'idle';
    const isGodMode = mode === 'godmode';

    // --- SEQUENCER LOGIC ---
    const triggerAction = (action: CoreMode) => {
        setMode(action);
        clearLogInterval();
        setLogs([]);

        const sequences: Record<string, string[]> = {
            dopamine: [
                "DETECTING ENGAGEMENT DROPOFF...",
                "INITIATING DOPAMINE INJECTION PROTOCOL...",
                "OPTIMIZING PACING FOR MAX RETENTION...",
                "ADDING VISCERAL HOOKS...",
                "SUCCESS: PREDICTED RETENTION 99.8%"
            ],
            storm: [
                "CONNECTING TO GLOBAL TREND-STREAM...",
                "SCANNING 1.5 MILLION VIDEOS/SEC...",
                "PATTERN DETECTED: #HyperGrowth...",
                "LOCKED ON VIRAL VECTOR...",
                "TRIANGULATING PERFECT OPPORTUNITY..."
            ],
            godmode: [
                ">>> GOD MODE SEQUENCE INITIATED <<<",
                "SCANNING TOPIC: HAPPINESS...",
                "ANALYZING HUBERMAN ARCHIVE (14M VIEWS)...",
                "EXTRACTING GENIUS PATTERNS: DOPAMINE LOOPS...",
                "GENERATING 30s VISUAL TUNNEL BLUEPRINTS...",
                ">>> OPTIMIZATION COMPLETE. EXECUTING GOD-TIER CREATION. <<<"
            ],
            scripting: [
                "INITIALIZING NARRATIVE MATRIX...",
                "GENERATING HERO'S JOURNEY ARC...",
                "INJECTING PSYCHOLOGICAL TRIGGERS...",
                "VALIDATING AGAINST WISDOM DATABASE...",
                "SCRIPT OPTIMIZED FOR VIRALITY."
            ],
            editing: [
                "ANALYZING AUDIO WAVEFORMS...",
                "SYNCING CUTS TO HEARTBEAT (120 BPM)...",
                "REMOVING SILENCE [0.03s]...",
                "APPLYING COLOR GRADE: 'CINEMATIC_TEAL'...",
                "RENDER COMPLETE."
            ],
            ab_testing: [
                "GENERATING THUMBNAIL VARIANTS [A/B]...",
                "SIMULATING HUMAN EYE-TRACKING...",
                "DETECTING SALIENCE HOTSPOTS...",
                "PREDICTING CTR DELTA...",
                "WINNER: VARIANT B (+14% CLICK RATE)"
            ]
        };

        const currentSeq = sequences[action] || ["SIMULATION RUNNING...", "PROCESSING DATA..."];
        let i = 0;

        // Start log sequence
        logIntervalRef.current = setInterval(() => {
            if (i < currentSeq.length) {
                setLogs(prev => [...prev, currentSeq[i]].slice(-6)); // Keep last 6 logs
                i++;
            } else {
                // For God Mode, keep generating random high-intensity logs or just loop
                if (action === 'godmode') {
                    // Keep adding god-like logs occasionally
                    if (Math.random() > 0.7) {
                        const godLogs = ["OPTIMIZING REALITY...", "SYNCING WITH GLOBAL ATTENTION...", "DMA MAXIMIZED..."];
                        setLogs(prev => [...prev, godLogs[Math.floor(Math.random() * godLogs.length)]].slice(-6));
                    }
                } else {
                    clearLogInterval();
                    // Auto-return to idle after 5s for non-god modes? Or keep running?
                    // Let's keep running until stop is clicked.
                }
            }
        }, action === 'godmode' ? 1200 : 800);
    };

    const toggleSimulation = () => {
        if (isSimulating) {
            setMode('idle');
            clearLogInterval();
            setLogs(prev => [...prev, "SIMULATION PAUSED."]);
        } else {
            // Default start behavior
            triggerAction('storm');
        }
    };

    const activateGodMode = () => {
        triggerAction('godmode');
    };

    return (
        <div className={`min-h-screen transition-colors duration-1000 ${isGodMode ? "bg-[#1a1200] text-yellow-50" : "bg-black text-white"} font-sans flex flex-col overflow-hidden transition-all duration-1000 ${cinemaMode ? "p-0" : "p-6"}`}>

            {/* Header: Hidden in Cinema Mode */}
            <motion.header
                animate={{ y: cinemaMode ? -100 : 0, opacity: cinemaMode ? 0 : 1 }}
                className={`flex items-center justify-between mb-8 border-b pb-6 shrink-0 z-50 relative transition-colors duration-500 ${isGodMode ? "border-yellow-500/20" : "border-white/10"}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-500 ${isGodMode ? "bg-gradient-to-br from-yellow-500 to-amber-600 shadow-[0_0_30px_#FACC15]" : "bg-gradient-to-br from-purple-600 to-blue-600"}`}>
                        <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-cyan-400">
                            VIRT VISION <span className={`text-xs align-top font-mono border rounded px-1 ml-1 transition-colors ${isGodMode ? "text-yellow-400 border-yellow-500/50 bg-yellow-500/10" : "text-red-500 border-red-500/30 bg-red-500/10"}`}>{isGodMode ? "GOD MODE" : "automated"}</span>
                        </h1>
                        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase">The Ultimate Video Brain</p>
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    {/* PROCESS ACTIONS */}
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 border border-white/10 mr-4">
                        <button onClick={() => triggerAction('scripting')} className="px-3 py-1.5 rounded hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-transparent hover:border-cyan-500/50 flex items-center gap-2 transition-all">
                            <Keyboard size={14} /> SCRIPTING
                        </button>
                        <button onClick={() => triggerAction('editing')} className="px-3 py-1.5 rounded hover:bg-orange-500/20 text-orange-400 text-xs font-bold border border-transparent hover:border-orange-500/50 flex items-center gap-2 transition-all">
                            <Scissors size={14} /> EDITING
                        </button>
                        <button onClick={() => triggerAction('ab_testing')} className="px-3 py-1.5 rounded hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-transparent hover:border-yellow-500/50 flex items-center gap-2 transition-all">
                            <FlaskConical size={14} /> A/B LAB
                        </button>
                    </div>

                    {/* ULTIMATE ACTIONS */}
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 border border-white/10 mr-4">
                        <button onClick={() => triggerAction('dopamine')} className="px-3 py-1.5 rounded hover:bg-green-500/20 text-green-400 text-xs font-bold border border-transparent hover:border-green-500/50 flex items-center gap-2 transition-all">
                            <Zap size={14} /> DOPAMINE
                        </button>
                        <button onClick={() => triggerAction('storm')} className="px-3 py-1.5 rounded hover:bg-pink-500/20 text-pink-400 text-xs font-bold border border-transparent hover:border-pink-500/50 flex items-center gap-2 transition-all">
                            <Globe size={14} /> STORM
                        </button>
                        <button onClick={activateGodMode} className={`px-3 py-1.5 rounded text-xs font-bold border border-transparent flex items-center gap-2 transition-all ${isGodMode ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_#FACC15] animate-pulse" : "hover:bg-white/20 text-white hover:border-white/50"}`}>
                            <Wand2 size={14} /> GOD
                        </button>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <button
                        onClick={() => setCinemaMode(!cinemaMode)}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${cinemaMode ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                    >
                        <Monitor className="w-4 h-4" /> {cinemaMode ? "EXIT CINEMA" : "CINEMA 16:9"}
                    </button>

                    <button
                        onClick={() => setFilmMode(!filmMode)}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${filmMode ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                    >
                        <Smartphone className="w-4 h-4" /> {filmMode ? "DESKTOP" : "SHORTS"}
                    </button>

                    <button
                        onClick={toggleSimulation}
                        className={`px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isSimulating ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30" : "bg-purple-600 text-white hover:bg-purple-500"}`}
                    >
                        {isSimulating ? <><Pause className="w-3 h-3 fill-current" /> STOP</> : <><Play className="w-3 h-3 fill-current" /> START</>}
                    </button>
                </div>
            </motion.header>

            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${filmMode ? "flex items-center justify-center bg-[#050505]" : ""} ${cinemaMode ? "bg-black" : ""}`}>

                {/* Cinema Mode Layout Override */}
                {cinemaMode && (
                    <div className="absolute top-4 right-4 z-[100] flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button onClick={() => setCinemaMode(false)} className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-full font-bold text-xs backdrop-blur-md transition-all">EXIT CINEMA MODE</button>
                    </div>
                )}

                <div
                    className={`
                        transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                        ${filmMode
                            ? "w-[400px] h-[800px] border-4 border-gray-800 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(168,85,247,0.2)] bg-black flex flex-col"
                            : cinemaMode
                                ? "w-full h-screen fixed inset-0 z-40 grid grid-cols-12 gap-0" // Cinema Mode: Fullscreen Grid
                                : "grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] w-full"
                        }
                    `}
                >
                    {/* FILM MODE HUD */}
                    <AnimatePresence>
                        {filmMode && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 pointer-events-none border-[1px] border-white/5 rounded-[2.8rem] m-1"
                            >
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl border-b border-x border-gray-800/50 flex items-center justify-center">
                                    <div className="w-16 h-1 rounded-full bg-gray-900 border border-gray-800" />
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/10 font-mono tracking-widest">
                                    NEURO-OS MOBILE
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CINEMA MODE REC INDICATOR */}
                    {cinemaMode && (
                        <div className="absolute top-8 left-8 z-[60] flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
                            <div className="font-mono text-red-500 text-xs tracking-widest">REC [16:9]</div>
                        </div>
                    )}

                    {/* COMPONENT 1: METRICS */}
                    <motion.div
                        animate={{ opacity: cinemaMode ? 0.8 : 1 }}
                        className={`
                            ${filmMode ? "absolute top-24 left-0 right-0 z-20 pointer-events-none p-4" : ""}
                            ${cinemaMode ? "col-span-3 h-full border-r border-white/5 bg-black/50 backdrop-blur-xl p-8 pt-32" : "lg:col-span-3 bg-card/10 border border-border/20 rounded-3xl overflow-hidden flex flex-col"}
                            ${(!filmMode && !cinemaMode) ? "lg:col-span-3" : ""}
                        `}
                    >
                        {filmMode ? (
                            <div className="flex gap-2 justify-center opacity-90 scale-90 origin-top">
                                {mode !== 'idle' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-[10px]">{mode.toUpperCase()}</motion.div>}
                            </div>
                        ) : (
                            <>
                                <div className={`border-b border-border/20 ${cinemaMode ? "mb-8 pb-4 border-white/10" : "p-4 bg-card/20"}`}>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Impact Prediction</h3>
                                </div>
                                <div className="flex-1 relative">
                                    <ViralPredictor godMode={isGodMode} />
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* COMPONENT 2: CORE VISUALIZATION */}
                    <div className={`${filmMode ? "flex-1 relative order-1" : cinemaMode ? "col-span-6 h-full relative" : "lg:col-span-6 flex flex-col gap-6"}`}>
                        <div className={`${filmMode ? "absolute inset-0" : cinemaMode ? "absolute inset-0 scale-110" : "flex-1 relative rounded-3xl overflow-hidden"}`}>
                            <VisionCore active={isSimulating} mode={mode} godMode={isGodMode} />

                            {/* GOD MODE FLOATING BUTTON (Visible when simulating but not yet in God Mode) */}
                            {isSimulating && !isGodMode && !filmMode && !cinemaMode && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={activateGodMode}
                                    className="absolute top-4 right-4 z-20 px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded-full shadow-[0_0_30px_#FACC15] flex items-center gap-2 animate-pulse"
                                >
                                    <Sparkles className="w-4 h-4" /> ACTIVATE GOD MODE
                                </motion.button>
                            )}
                        </div>

                        {/* Console Logs */}
                        {(!filmMode && !cinemaMode) && (
                            <div className={`h-48 rounded-3xl border p-6 font-mono text-xs overflow-hidden relative transition-colors duration-500 
                                ${isGodMode ? "bg-black border-yellow-500/40 shadow-[0_0_30px_rgba(250,204,21,0.1)]" : "bg-black border-green-500/20"}`}>
                                <div className={`absolute top-2 right-4 text-[10px] uppercase transition-colors ${isGodMode ? "text-yellow-500/50" : "text-green-500/50"}`}>
                                    {isGodMode ? "Divine Log" : "Neural Log"}
                                </div>
                                <div className="space-y-1 h-full flex flex-col justify-end">
                                    {logs.map((log, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={isGodMode ? "text-yellow-400" : "text-green-500/80"}>
                                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>{log}
                                        </motion.div>
                                    ))}
                                    {logs.length === 0 && <div className={isGodMode ? "text-yellow-900/40 italic" : "text-green-900/40 italic"}>System Idle...</div>}
                                </div>
                            </div>
                        )}

                        {/* Cinema Mode Console Overlay */}
                        {cinemaMode && (
                            <div className="absolute bottom-20 left-0 right-0 text-center z-50 pointer-events-none">
                                <AnimatePresence mode="wait">
                                    {logs.length > 0 && (
                                        <motion.div
                                            key={logs[logs.length - 1]}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className={`inline-block px-6 py-2 backdrop-blur-md border rounded-full font-mono text-sm ${isGodMode ? "bg-yellow-900/60 border-yellow-500/30 text-yellow-400" : "bg-black/60 border-white/10 text-cyan-400"}`}
                                        >
                                            {logs[logs.length - 1]}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Film Mode Console Overlay */}
                        {filmMode && (
                            <div className="absolute bottom-40 left-6 right-6 h-32 pointer-events-none flex flex-col justify-end font-mono text-[10px] gap-1 z-30">
                                <AnimatePresence mode="popLayout">
                                    {logs.slice(-5).map((log, i) => (
                                        <motion.div
                                            key={i + log}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`backdrop-blur-sm self-start px-2 py-0.5 rounded border-l-2 ${isGodMode ? "bg-yellow-900/40 border-yellow-500 text-yellow-300" : "bg-black/60 border-green-500 text-green-400/90"}`}
                                        >
                                            {`> ${log}`}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* COMPONENT 3: IDEA STREAM */}
                    <motion.div
                        animate={{ opacity: cinemaMode ? 0.8 : 1 }}
                        className={`
                            ${filmMode ? "h-[25%] relative z-10 bg-gradient-to-t from-black via-black to-transparent pt-4 order-2" : ""}
                            ${cinemaMode ? "col-span-3 h-full border-l border-white/5 bg-black/50 backdrop-blur-xl p-8 pt-32" : "lg:col-span-3 bg-card/10 border border-border/20 rounded-3xl overflow-hidden flex flex-col"}
                            ${(!filmMode && !cinemaMode) ? "lg:col-span-3" : ""}
                        `}
                    >
                        {!filmMode && <div className={`border-b border-border/20 ${cinemaMode ? "mb-8 pb-4 border-white/10" : "p-4 bg-card/20"}`}><h3 className="text-xs font-bold text-gray-400 uppercase">Stream</h3></div>}
                        <div className="flex-1 relative h-full">
                            <IdeaStream godMode={isGodMode} />
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
