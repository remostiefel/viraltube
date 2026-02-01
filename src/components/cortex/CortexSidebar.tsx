"use client";

import { useEffect, useState } from "react";
import { fetchRecentChannelVideosAction, getTemplatesAction } from "@/app/actions";
import { Youtube, Lightbulb, Map, GripVertical } from "lucide-react";

export function CortexSidebar() {
    const [videos, setVideos] = useState<any[]>([]);
    const [wisdoms, setWisdoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [vids, wis] = await Promise.all([
                    fetchRecentChannelVideosAction(),
                    getTemplatesAction("viral-wisdom", undefined)
                ]);
                setVideos(vids.slice(0, 5)); // Limit to recent 5
                setWisdoms(wis.slice(0, 10)); // Limit to 10
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const onDragStart = (event: React.DragEvent, nodeType: string, payload: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/json', JSON.stringify(payload));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r border-border/20 bg-black/40 h-full flex flex-col backdrop-blur-md">
            <div className="p-4 border-b border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                    <Map className="w-4 h-4" /> Canvas Library
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1">Drag items to the canvas</p>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-6">

                {/* VIDEOS */}
                <div>
                    <h3 className="text-xs font-bold text-red-500 uppercase mb-2 px-2 flex items-center gap-1">
                        <Youtube className="w-3 h-3" /> Recent Videos
                    </h3>
                    <div className="space-y-2">
                        {videos.map(v => (
                            <div
                                key={v.id}
                                onDragStart={(event) => onDragStart(event, 'cortexNode', {
                                    type: 'video',
                                    label: v.title,
                                    videoId: v.id,
                                    thumbnail: v.thumbnailUrl
                                })}
                                draggable
                                className="bg-red-500/10 border border-red-500/20 p-2 rounded cursor-grab active:cursor-grabbing hover:bg-red-500/20 transition-colors group"
                            >
                                <div className="text-[10px] font-bold text-red-200 line-clamp-2 leading-tight">
                                    {v.title}
                                </div>
                                <div className="text-[9px] text-red-400/50 mt-1 flex items-center gap-1">
                                    <GripVertical className="w-3 h-3" />
                                    Drag to map
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* WISDOM */}
                <div>
                    <h3 className="text-xs font-bold text-purple-500 uppercase mb-2 px-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Wisdom Nuggets
                    </h3>
                    <div className="space-y-2">
                        {wisdoms.map(w => (
                            <div
                                key={w.id}
                                onDragStart={(event) => onDragStart(event, 'cortexNode', {
                                    type: 'wisdom',
                                    label: w.name.replace("Wisdom: ", "").replace("Master Principle: ", ""),
                                    wisdomId: w.id,
                                    description: w.content?.[0]?.principle?.substring(0, 50)
                                })}
                                draggable
                                className="bg-purple-500/10 border border-purple-500/20 p-2 rounded cursor-grab active:cursor-grabbing hover:bg-purple-500/20 transition-colors"
                            >
                                <div className="text-[10px] font-bold text-purple-200 line-clamp-2 leading-tight">
                                    {w.name.replace("Wisdom: ", "").replace("Master Principle: ", "")}
                                </div>
                                <div className="text-[9px] text-purple-400/50 mt-1 flex items-center gap-1">
                                    <GripVertical className="w-3 h-3" />
                                    {w.wisdomCategory || "Axiom"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </aside>
    );
}
