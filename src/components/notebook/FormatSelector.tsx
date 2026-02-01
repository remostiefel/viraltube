"use client";

import { useState, useEffect } from "react";
import { getFormatsAction } from "@/app/actions";
import { FormatProfile } from "@/lib/formats";
import { Clock, Scissors, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatSelectorProps {
    selectedId?: string;
    onSelect: (formatId: string) => void;
}

export function FormatSelector({ selectedId, onSelect }: FormatSelectorProps) {
    const [formats, setFormats] = useState<FormatProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFormatsAction().then(data => {
            setFormats(data);
            setLoading(false);
            // Default to 2nd item (Standard Short) if nothing selected
            if (!selectedId && data.length > 1) {
                onSelect(data[1].id);
            }
        });
    }, []);

    if (loading) return <div className="h-24 animate-pulse bg-muted rounded-xl" />;

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Content Physics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formats.map(f => {
                    const isSelected = selectedId === f.id;
                    return (
                        <button
                            key={f.id}
                            onClick={() => onSelect(f.id)}
                            className={cn(
                                "flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden",
                                isSelected
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground rounded-bl-lg">
                                    <Zap className="w-3 h-3" />
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-1">
                                <span className={cn("font-bold text-sm", isSelected ? "text-primary dark:text-white" : "text-foreground")}>
                                    {f.label}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                                {f.description}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] bg-background/50 p-2 rounded-lg border border-border/50">
                                <div className="flex items-center gap-1" title="Duration">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    <span>{f.targetDurationSeconds}s</span>
                                </div>
                                <div className="flex items-center gap-1" title="Word Count">
                                    <FileText className="w-3 h-3 text-emerald-400" />
                                    <span>~{f.targetWordCount}w</span>
                                </div>
                                <div className="flex items-center gap-1" title="Cuts per sec">
                                    <Scissors className="w-3 h-3 text-orange-400" />
                                    <span>{f.visualPacingSeconds}s/cut</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
