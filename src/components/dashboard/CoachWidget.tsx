"use client";

import { useState, useEffect } from "react";
import { generateCoachBriefingAction } from "@/app/actions";
import { Bot, RefreshCw, MessageSquareQuote } from "lucide-react";

export function CoachWidget() {
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to load from session storage first to avoid API spam on nav
        const cached = sessionStorage.getItem("nc_coach_briefing");
        if (cached) {
            setBriefing(cached);
            setLoading(false);
        } else {
            refreshBriefing();
        }
    }, []);

    const refreshBriefing = async () => {
        setLoading(true);
        try {
            const text = await generateCoachBriefingAction();
            setBriefing(text);
            sessionStorage.setItem("nc_coach_briefing", text);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot className="w-24 h-24 text-white" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                        <MessageSquareQuote className="w-4 h-4 text-indigo-300" />
                    </div>
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Neuro-Coach Briefing</h3>
                    <button
                        onClick={refreshBriefing}
                        disabled={loading}
                        className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                        title="Refresh Briefing"
                    >
                        <RefreshCw className={`w-3 h-3 text-white/50 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="min-h-[3rem] flex items-center">
                    {loading && !briefing ? (
                        <div className="space-y-2 w-full animate-pulse">
                            <div className="h-2 bg-indigo-400/20 rounded w-3/4"></div>
                            <div className="h-2 bg-indigo-400/20 rounded w-1/2"></div>
                        </div>
                    ) : (
                        <p className="text-lg font-medium text-white/90 italic leading-relaxed">
                            "{briefing}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
