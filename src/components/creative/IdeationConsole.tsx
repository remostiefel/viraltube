"use client";

import { useState, useEffect } from "react";
import { NotebookItem } from "@/lib/notebook-types";
import { getNotebookItemsAction, startGenesisAction } from "@/app/actions";
import {
    BrainCircuit,
    Sparkles,
    Zap,
    Target,
    ArrowRight,
    Loader2,
    CheckCircle2,
    RefreshCw,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeationConsoleProps {
    onOpenAnalysis?: () => void;
}

export function IdeationConsole({ onOpenAnalysis }: IdeationConsoleProps) {
    const [items, setItems] = useState<NotebookItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<NotebookItem | null>(null);
    const [loading, setLoading] = useState(false);

    // Phase 1: Brainstorming (Divergence)
    const [brainstorming, setBrainstorming] = useState(false);
    const [variations, setVariations] = useState<Array<{ title: string; angle: string }>>([]);
    const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

    // Phase 2: Format Selection (Convergence)
    const [format, setFormat] = useState<"loop" | "short" | "long" | null>(null);

    // Phase 3: Genesis
    const [isGenesisRunning, setIsGenesisRunning] = useState(false);
    const [genesisSuccess, setGenesisSuccess] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const data = await getNotebookItemsAction();
        // Filter for "Idea" or "Researching" phase
        setItems(data.filter(i => i.type === "topic" && (i.status === "Idea" || i.status === "Researching")));
    };

    const handleBrainstorm = async () => {
        if (!selectedItem) return;
        setBrainstorming(true);

        // SIMULATION: Call AI here later.
        setTimeout(() => {
            setVariations([
                { title: `Why ${selectedItem.title} is a Lie`, angle: "Provocative / Debunking" },
                { title: `The Secret History of ${selectedItem.title}`, angle: "Storytelling / Mystery" },
                { title: `How to Master ${selectedItem.title} in 30s`, angle: "Educational / Speed" },
                { title: `I tried ${selectedItem.title} for 7 Days`, angle: "Vlog / Experiment" },
                { title: `${selectedItem.title}: The Grim Reality`, angle: "Dark / Truth" },
            ]);
            setBrainstorming(false);
        }, 1500);
    };

    const handleGenesis = async () => {
        if (!selectedItem || !format || selectedVariation === null) return;
        setIsGenesisRunning(true);

        // We would ideally pass the *selected variation* and *format* to Genesis
        // For now, we trigger the standard Genesis but we could update the item description first!

        const chosenConfig = variations[selectedVariation];
        const newDesc = `[FORMAT: ${format.toUpperCase()}] [ANGLE: ${chosenConfig.angle}]\n${selectedItem.description}`;

        // Mock update
        // await updateNotebookItemAction(selectedItem.id, { description: newDesc, title: chosenConfig.title });

        const result = await startGenesisAction({
            ...selectedItem,
            title: chosenConfig.title, // Use optimized title
            description: newDesc
        });

        if (result.success) {
            setGenesisSuccess(true);
        }
        setIsGenesisRunning(false);
    };

    return (
        <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[700px]">
            {/* LEFT: Input Console */}
            <div className="w-full md:w-1/3 border-r border-gray-800 bg-gray-900/50 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-gray-400 uppercase tracking-widest text-xs font-bold">
                    <BrainCircuit className="w-4 h-4" /> Notebook Input
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => { setSelectedItem(item); setVariations([]); setFormat(null); setGenesisSuccess(false); }}
                            className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all",
                                selectedItem?.id === item.id
                                    ? "bg-blue-600/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/20"
                                    : "bg-gray-900 border-gray-800 hover:border-gray-600"
                            )}
                        >
                            <h4 className="font-bold text-gray-200">{item.title}</h4>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{item.status}</span>
                                {item.tags && item.tags.length > 0 && <span className="text-xs text-gray-500">#{item.tags[0]}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Creative Engine */}
            <div className="flex-1 p-8 bg-black relative flex flex-col">
                {selectedItem ? (
                    <div className="flex-1 flex flex-col space-y-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                {selectedItem.title}
                            </h2>
                            <p className="text-gray-500 mt-2">{selectedItem.description || "No description provided."}</p>
                        </div>

                        {/* STEP 1: BRAINSTORM */}
                        <div className="space-y-4 border-b border-gray-800 pb-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    1. Divergence (Variations)
                                </h3>
                                <button
                                    onClick={handleBrainstorm}
                                    disabled={brainstorming}
                                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors"
                                >
                                    {brainstorming ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    {variations.length > 0 ? "Regenerate" : "Ignite"}
                                </button>
                            </div>

                            {variations.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {variations.map((v, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedVariation(idx)}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                                                selectedVariation === idx
                                                    ? "bg-purple-600/20 border-purple-500"
                                                    : "bg-gray-900 border-gray-800 hover:border-gray-600"
                                            )}
                                        >
                                            <div>
                                                <div className="font-bold text-gray-200">{v.title}</div>
                                                <div className="text-xs text-purple-400">{v.angle}</div>
                                            </div>
                                            {selectedVariation === idx && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl">
                                    <button
                                        onClick={handleBrainstorm}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20"
                                    >
                                        Ignite Neural Engine
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: FORMAT */}
                        {selectedVariation !== null && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Target className="w-5 h-5 text-red-400" />
                                    2. Convergence (Format)
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: "loop", label: "30s Loop", icon: RefreshCw, desc: "High Retention" },
                                        { id: "short", label: "Narrative", icon: Play, desc: "Connection" },
                                        { id: "long", label: "Deep Dive", icon: Book, desc: "Authority" }, // Book icon temporarily imported or ignore
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFormat(f.id as any)}
                                            className={cn(
                                                "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                                                format === f.id
                                                    ? "bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-500/10"
                                                    : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                                            )}
                                        >
                                            <f.icon className="w-6 h-6" />
                                            <div className="font-bold text-sm">{f.label}</div>
                                            <div className="text-[10px] uppercase tracking-wider opacity-70">{f.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: EXECUTE */}
                        {format && selectedVariation !== null && (
                            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4">
                                <button
                                    onClick={handleGenesis}
                                    disabled={isGenesisRunning || genesisSuccess}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                                        genesisSuccess
                                            ? "bg-green-600 text-white"
                                            : "bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
                                    )}
                                >
                                    {isGenesisRunning ? (
                                        <><Loader2 className="animate-spin" /> Initializing...</>
                                    ) : genesisSuccess ? (
                                        <><CheckCircle2 /> Genesis Complete</>
                                    ) : (
                                        <><Zap className="w-5 h-5 fill-black" /> Lock In & Generate Assets</>
                                    )}
                                </button>
                                {genesisSuccess && (
                                    <p className="text-center text-green-400 mt-2 text-sm">Assets saved to Desktop. Ready for production.</p>
                                )}
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                        <BrainCircuit className="w-16 h-16 opacity-20" />
                        <p>Select a Notebook Item to begin the Creative Loop.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icon component
function Book(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
    )
}
