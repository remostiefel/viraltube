"use client";

import { useState, useEffect } from "react";
import { fetchEnhancedChannelVideosAction } from "@/app/actions";
import { OutlierVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { BarChart2, Eye, ThumbsUp, Percent, RefreshCw } from "lucide-react";

export function RealTimeContent() {
    const [period, setPeriod] = useState<"48h" | "28d">("48h");
    const [videos, setVideos] = useState<OutlierVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    async function load() {
        if (!loading) setIsRefreshing(true);
        try {
            // Fetch more videos to ensure we cover 28 days
            const token = localStorage.getItem("nc_google_access_token");
            const data = await fetchEnhancedChannelVideosAction(token);
            setVideos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, 60000); // Auto-refresh every 60s
        return () => clearInterval(interval);
    }, []);

    const displayVideos = [...videos].filter(v => {
        const diff = new Date().getTime() - new Date(v.publishedAt).getTime();
        // Period filters by PUBLISH DATE
        if (period === "48h") return diff < 48 * 60 * 60 * 1000;
        if (period === "28d") return diff < 28 * 24 * 60 * 60 * 1000;
        return true;
    }).sort((a, b) => {
        // 48h = News Ticker (Latest First)
        if (period === "48h") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        // 28d = Leaderboard (Most Views First)
        return b.viewCount - a.viewCount;
    }).slice(0, 5);

    return (
        <div className="bg-card/20 border border-border/20 rounded-xl overflow-hidden flex flex-col h-full min-h-[300px]">
            {/* Header */}
            <div className="p-4 border-b border-border/10 flex items-center justify-between bg-black/20">
                <h3 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    Popular Content
                    {isRefreshing && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                </h3>

                {/* Toggle */}
                <div className="flex bg-black/40 p-1 rounded-lg gap-1">
                    <button
                        onClick={() => setPeriod("48h")}
                        className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                            period === "48h" ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                        title="Published in last 48h"
                    >
                        48h
                    </button>
                    <button
                        onClick={() => setPeriod("28d")}
                        className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                            period === "28d" ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                        title="Published in last 28d"
                    >
                        28d
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">Loading analytics...</div>
                ) : (
                    displayVideos.map((v, i) => (
                        <div key={v.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                            <div className="relative w-16 h-9 rounded bg-muted overflow-hidden flex-shrink-0 border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                                    {v.title}
                                </div>
                                <div className="grid grid-cols-2 gap-1 mt-1.5 w-full">
                                    {/* Views */}
                                    <div className="flex flex-col items-center p-1 bg-blue-500/10 rounded">
                                        <div className="text-[8px] text-blue-400 font-bold uppercase">Views</div>
                                        <div className="text-[10px] font-mono font-bold text-blue-400">
                                            {v.viewCount >= 1000 ? `${(v.viewCount / 1000).toFixed(1)}K` : v.viewCount}
                                        </div>
                                    </div>

                                    {/* Likes */}
                                    <div className="flex flex-col items-center p-1 bg-pink-500/10 rounded">
                                        <div className="text-[8px] text-pink-400 font-bold uppercase">Likes</div>
                                        <div className="text-[10px] font-mono font-bold text-pink-400">
                                            {v.likeCount !== undefined && v.likeCount > 0
                                                ? (v.likeCount >= 1000 ? `${(v.likeCount / 1000).toFixed(1)}K` : v.likeCount)
                                                : "—"}
                                        </div>
                                    </div>


                                </div>
                            </div>

                            {/* Rank Number (Subtle) */}
                            <div className="text-xs font-mono font-bold text-amber-500/80 group-hover:text-amber-400">
                                #{i + 1}
                            </div>
                        </div>
                    ))
                )}

                {!loading && displayVideos.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                        No videos published in the last {period}.
                        <br />
                        {period === "48h" && (
                            <button onClick={() => setPeriod("28d")} className="text-blue-400 hover:underline mt-2">
                                Check last 28 days
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-border/10 bg-black/20 text-center">
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                    Views: Total • Filter: Publish Time
                </div>
            </div>
        </div>
    );
}
