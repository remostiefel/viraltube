"use client";

import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles, Plus, X, Info, Check } from "lucide-react";
import { researchViralIdeasAction, createNotebookItemAction } from "@/app/actions";
import { VideoIdea } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { FormatSelector } from "./FormatSelector";
import { useToast } from "@/components/ui/Toast";

interface IdeaSearchModuleProps {
    onClose: () => void;
    onAddIdea: () => void; // Callback to refresh notebook
}

export function IdeaSearchModule({ onClose, onAddIdea }: IdeaSearchModuleProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [ideas, setIdeas] = useState<VideoIdea[]>([]);
    const [scanned, setScanned] = useState(false);
    const [addingMap, setAddingMap] = useState<Record<number, boolean>>({});
    const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
    const [formatId, setFormatId] = useState<string>("micro-short");

    const handleResearch = async () => {
        setLoading(true);
        try {
            const results = await researchViralIdeasAction();
            setIdeas(results);
            setScanned(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToNotebook = async (idea: VideoIdea, index: number) => {
        setAddingMap(prev => ({ ...prev, [index]: true }));
        try {
            await createNotebookItemAction(
                "topic",
                idea.title,
                `HOOK: ${idea.hook}\n\nANGLE: ${idea.angle}\n\nTHUMBNAIL: ${idea.thumbnailIdea}`,
                "medium",
                ["Trend-Scout", "AI-Generated"],
                formatId
            );
            // Visual feedback + Callback
            onAddIdea();
            setAddedIndices(prev => new Set(prev).add(index));
            toast({
                title: "Opportunity Saved",
                description: "Added to your Notebook Topics. You can now drag it to Scripting.",
                variant: "success",
            });
        } catch (e) {
            console.error(e);
        } finally {
            setAddingMap(prev => ({ ...prev, [index]: false }));
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                            <BrainCircuit className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Trend Radar®</h2>
                            <p className="text-sm text-muted-foreground">Scans the internet for viral outliers & adapts them to your niche.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!scanned && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Sparkles className="w-12 h-12 text-cyan-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">Ready to Scan</h3>
                            <p className="max-w-md mx-auto mt-2 mb-6">
                                The system will analyze top-performing videos in Neuroscience, Biohacking, and Psychology to generate fresh concepts.
                            </p>
                            <button
                                onClick={handleResearch}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                <BrainCircuit className="w-5 h-5" />
                                Start Research
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                            <h3 className="text-lg font-medium text-foreground animate-pulse">Scanning Neural Network...</h3>
                            <p className="text-sm text-muted-foreground mt-2">Analyzing outliers & generating hooks...</p>
                        </div>
                    )}

                    {scanned && !loading && (
                        <div className="space-y-6">
                            {/* Format Selection - Global for this batch */}
                            <div className="bg-muted/10 border border-border p-4 rounded-xl">
                                <FormatSelector
                                    selectedId={formatId}
                                    onSelect={setFormatId}
                                />
                            </div>

                            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg mb-4 flex items-start gap-3">
                                <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-muted-foreground">
                                    <span className="text-foreground font-semibold">Workflow Tip:</span> Click <Plus className="inline w-3 h-3" /> to add ideas to your <strong>Notebook Topics</strong>. Once added, you can drag them to "Scripting" to launch the Genesis Engine.
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Identified Opportunities ({ideas.length})
                            </h3>
                            {ideas.map((idea, i) => {
                                const isAdded = addedIndices.has(i);
                                return (
                                    <div key={i} className={cn(
                                        "bg-muted/10 border p-4 rounded-xl transition-all group",
                                        isAdded ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-cyan-500/50"
                                    )}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className={cn(
                                                    "font-bold text-lg mb-1 transition-colors",
                                                    isAdded ? "text-emerald-400" : "text-foreground group-hover:text-cyan-400"
                                                )}>
                                                    {idea.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded font-mono",
                                                        isAdded ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"
                                                    )}>
                                                        HOOK
                                                    </span>
                                                    <p className="text-sm text-muted-foreground italic line-clamp-1">
                                                        &quot;{idea.hook}&quot;
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
                                                    <span className="font-bold text-xs text-foreground/70 uppercase">Psych Angle: </span>
                                                    {idea.angle}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAddToNotebook(idea, i)}
                                                disabled={addingMap[i] || isAdded}
                                                className={cn(
                                                    "p-3 rounded-lg flex items-center gap-2 transition-all min-w-[44px] justify-center",
                                                    isAdded
                                                        ? "bg-emerald-500 text-black shadow-none cursor-default"
                                                        : addingMap[i]
                                                            ? "bg-muted text-muted-foreground"
                                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                                                )}
                                            >
                                                {addingMap[i] ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : isAdded ? (
                                                    <Check className="w-5 h-5 font-bold" />
                                                ) : (
                                                    <Plus className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
