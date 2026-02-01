"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, X, Lightbulb, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpItem, HELP_CONTENT } from "@/lib/help-content";

// --- Context ---
interface HelpContextType {
    isInsightMode: boolean;
    toggleInsightMode: () => void;
    currentHelpId: string | null;
    showHelp: (id: string) => void;
    hideHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function useHelp() {
    const context = useContext(HelpContext);
    if (!context) {
        throw new Error("useHelp must be used within a HelpProvider");
    }
    return context;
}

// --- Provider ---
export function HelpProvider({ children }: { children: React.ReactNode }) {
    const [isInsightMode, setIsInsightMode] = useState(false);
    const [currentHelpId, setCurrentHelpId] = useState<string | null>(null);

    const toggleInsightMode = () => {
        setIsInsightMode(prev => !prev);
        // Clear help when turning off mode
        if (isInsightMode) setCurrentHelpId(null);
    };

    const showHelp = (id: string) => setCurrentHelpId(id);
    const hideHelp = () => setCurrentHelpId(null);

    return (
        <HelpContext.Provider value={{ isInsightMode, toggleInsightMode, currentHelpId, showHelp, hideHelp }}>
            {children}
            <HelpOverlay />
        </HelpContext.Provider>
    );
}

// --- Components ---

// 1. The Trigger Icon
import { Tooltip } from "./Tooltip";

export function HelpTrigger({ helpId, children, className, side = "top" }: { helpId: string, children?: React.ReactNode, className?: string, side?: "top" | "bottom" | "left" | "right" }) {
    const { isInsightMode, showHelp } = useHelp();
    const content = HELP_CONTENT[helpId];

    // If no content found, just render children
    if (!content) return <>{children}</>;

    return (
        <div className={cn("inline-flex items-center gap-2", className)}>
            <Tooltip content={content.tagline || content.concept} side={side}>
                <span className={isInsightMode ? "cursor-help decoration-cyan-500/50 underline decoration-dotted underline-offset-4" : ""}>
                    {children}
                </span>
            </Tooltip>

            {isInsightMode && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-colors cursor-help shrink-0"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showHelp(helpId);
                    }}
                >
                    <BrainCircuit className="w-3 h-3" />
                </motion.button>
            )}
        </div>
    );
}

// 2. The Global Overlay Card
function HelpOverlay() {
    const { currentHelpId, hideHelp } = useHelp();
    const content = currentHelpId ? HELP_CONTENT[currentHelpId] : null;

    if (!currentHelpId || !content) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">
                {/* Backdrop - clickable to close */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    onClick={hideHelp}
                />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="relative bg-black/90 border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)] pointer-events-auto"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-950/50 to-transparent p-6 border-b border-cyan-500/20 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                <BrainCircuit className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">{content.title}</h2>
                                <p className="text-sm text-cyan-400/60 font-mono uppercase tracking-wider">{content.module}</p>
                            </div>
                        </div>
                        <button
                            onClick={hideHelp}
                            className="text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                        {/* 1. CONCEPT */}
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                CONCEPT
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed ps-6 border-l-2 border-yellow-500/20">
                                {content.concept}
                            </p>
                        </section>

                        {/* 2. WORKFLOW */}
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                                <ArrowRight className="w-4 h-4 text-green-500" />
                                WORKFLOW
                            </h3>
                            <div className="space-y-3 ps-2">
                                {content.workflow.map((step: string, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-sm group">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 flex items-center justify-center text-xs font-mono group-hover:bg-green-500 group-hover:text-black transition-colors">
                                            {idx + 1}
                                        </span>
                                        <span className="text-gray-300 pt-0.5">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. OPPORTUNITY */}
                        <section className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-300 mb-2">
                                <Zap className="w-4 h-4 text-indigo-400" />
                                OPPORTUNITY
                            </h3>
                            <p className="text-sm text-indigo-200/80 italic leading-relaxed">
                                "{content.opportunity}"
                            </p>
                        </section>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// 3. Toggle Button Component (to be placed in Header)
export function InsightModeToggle() {
    const { isInsightMode, toggleInsightMode } = useHelp();

    return (
        <button
            onClick={toggleInsightMode}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                isInsightMode
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
                    : "bg-transparent border-gray-800 text-gray-500 hover:text-gray-300"
            )}
            title="Toggle Insight Mode"
        >
            <BrainCircuit className={cn("w-4 h-4", isInsightMode && "animate-pulse")} />
            <span className="text-xs font-bold uppercase tracking-wider">
                {isInsightMode ? "Insight ON" : "Insight OFF"}
            </span>
        </button>
    );
}
