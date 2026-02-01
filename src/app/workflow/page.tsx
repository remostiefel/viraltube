"use client";

import { useState } from "react";
import { CortexSidebar } from "@/components/cortex/CortexSidebar";
import { Brain, FileText, Camera, Sparkles, ChevronRight, Check, Loader2, Play } from "lucide-react";
import { generateVideoIdeas, generateScriptAction, optimizeTitleAction } from "@/app/actions";
import { VideoIdea, OptimizationResult } from "@/lib/gemini";
import { GeneratedScript } from "@/lib/openai";

// Local Interface Definitions
interface WorkflowIdea extends VideoIdea {
    id: string;
    selected: boolean;
    script?: GeneratedScript;
    status: "concept" | "scripting" | "ready" | "recorded";
}

export default function WorkflowPage() {
    const [activeTab, setActiveTab] = useState<"concept" | "script" | "production">("concept");
    const [workflowItems, setWorkflowItems] = useState<WorkflowIdea[]>([]);

    const addToWorkflow = (ideas: VideoIdea[]) => {
        const newItems = ideas.map(idea => ({
            ...idea,
            id: Math.random().toString(36).substr(2, 9),
            selected: true,
            status: "concept" as const
        }));
        setWorkflowItems(prev => [...prev, ...newItems]);
        setActiveTab("script");
    };

    const updateItemStatus = (id: string, updates: Partial<WorkflowIdea>) => {
        setWorkflowItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden font-sans">
            <header className="h-14 border-b border-white/10 flex items-center px-6 bg-black/40 backdrop-blur-sm z-10">
                <Sparkles className="w-5 h-5 text-amber-400 mr-2" />
                <h1 className="text-lg font-bold tracking-widest text-white uppercase">Content Factory</h1>
                <span className="ml-4 text-xs text-neutral-500 font-mono">BATCH_PROCESS_V1</span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <CortexSidebar />

                <main className="flex-1 relative flex flex-col">
                    {/* Navigation */}
                    <div className="border-b border-white/10 p-4 flex items-center space-x-4 bg-neutral-900/50">
                        <TabButton
                            active={activeTab === "concept"}
                            onClick={() => setActiveTab("concept")}
                            icon={Brain}
                            label="1. Concept Lab"
                        />
                        <ChevronRight className="w-4 h-4 text-neutral-700" />
                        <TabButton
                            active={activeTab === "script"}
                            onClick={() => setActiveTab("script")}
                            icon={FileText}
                            label={`2. Script Batch (${workflowItems.filter(i => i.status === "concept" && i.selected).length})`}
                        />
                        <ChevronRight className="w-4 h-4 text-neutral-700" />
                        <TabButton
                            active={activeTab === "production"}
                            onClick={() => setActiveTab("production")}
                            icon={Camera}
                            label={`3. Production (${workflowItems.filter(i => i.status === "ready").length})`}
                        />
                    </div>

                    <div className="flex-1 overflow-auto p-6 relative">
                        {activeTab === "concept" && <ConceptLab onAddIdeas={addToWorkflow} />}
                        {activeTab === "script" && <ScriptBatcher items={workflowItems} onUpdate={updateItemStatus} />}
                        {activeTab === "production" && <ProductionView items={workflowItems} />}
                    </div>
                </main>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${active ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-neutral-400 hover:text-white"}`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}

// --- TAB COMPONENTS ---

function ConceptLab({ onAddIdeas }: { onAddIdeas: (ideas: VideoIdea[]) => void }) {
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedIdeas, setGeneratedIdeas] = useState<VideoIdea[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const ideas = await generateVideoIdeas(topic);
            setGeneratedIdeas(ideas);
            setSelectedIndices(ideas.map((_, i) => i)); // Select all by default
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApprove = () => {
        const selected = generatedIdeas.filter((_, i) => selectedIndices.includes(i));
        onAddIdeas(selected);
        setGeneratedIdeas([]);
        setTopic("");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-amber-500" />
                    Topic Generator
                </h2>

                <div className="flex gap-4">
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg p-3 text-white placeholder:text-neutral-700 focus:outline-none focus:border-amber-500/50"
                        placeholder="Enter a broad topic (e.g. 'Dopamine Detox', 'Sleep Hygiene')..."
                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic}
                        className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate
                    </button>
                </div>
            </div>

            {generatedIdeas.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-neutral-400">Select concepts to move to scripting:</h3>
                        <button onClick={handleApprove} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-lg transition-colors flex items-center">
                            <Check className="w-4 h-4 mr-2" />
                            Approve Selected ({selectedIndices.length})
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {generatedIdeas.map((idea, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedIndices.includes(i) ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg">{idea.title}</h3>
                                    {selectedIndices.includes(i) && <div className="bg-amber-500 text-black p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                                </div>
                                <p className="text-neutral-400 mt-1 italic">"{idea.hook}"</p>
                                <div className="mt-3 flex gap-2 text-xs">
                                    <span className="bg-white/10 px-2 py-1 rounded">Angle: {idea.angle}</span>
                                    <span className="bg-white/10 px-2 py-1 rounded">Thumb: {idea.thumbnailIdea}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ScriptBatcher({ items, onUpdate }: { items: WorkflowIdea[], onUpdate: (id: string, data: any) => void }) {
    const conceptItems = items.filter(i => i.status === "concept" || i.status === "scripting");

    const generateScript = async (item: WorkflowIdea) => {
        onUpdate(item.id, { status: "scripting" });
        try {
            const script = await generateScriptAction(item.title || "Untitled", "DE", undefined, false, "long");
            if (script) {
                onUpdate(item.id, {
                    script,
                    status: "ready"
                });
            } else {
                onUpdate(item.id, { status: "concept" }); // Revert on fail
            }
        } catch (e) {
            console.error(e);
            onUpdate(item.id, { status: "concept" });
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-cyan-500" />
                    Script Generation Queue
                </h2>
                {/* Batch button could go here */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conceptItems.length === 0 && <div className="text-neutral-500 col-span-full text-center py-10">No concepts waiting. Go to Concept Lab.</div>}

                {conceptItems.map(item => (
                    <div key={item.id} className="bg-neutral-900 border border-white/10 rounded-xl p-5 flex flex-col">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-neutral-500 mb-4 line-clamp-3">{item.hook}</p>

                        <div className="mt-auto">
                            {item.status === "scripting" ? (
                                <div className="flex items-center text-cyan-400 animate-pulse text-sm">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Script...
                                </div>
                            ) : (
                                <button
                                    onClick={() => generateScript(item)}
                                    className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 py-2 rounded-lg transition-all text-sm font-medium flex justify-center items-center"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Script
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductionView({ items }: { items: WorkflowIdea[] }) {
    const readyItems = items.filter(i => i.status === "ready" || i.status === "recorded");
    const [selectedItem, setSelectedItem] = useState<WorkflowIdea | null>(null);
    const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimize = async (title: string) => {
        if (!title) return;
        setIsOptimizing(true);
        try {
            const res = await optimizeTitleAction(title);
            setOptimization(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsOptimizing(false);
        }
    };

    // Reset optimization when switching items
    if (selectedItem && optimization && optimization.original !== selectedItem.title) {
        setOptimization(null);
    }

    return (
        <div className="h-full flex gap-6">
            {/* List */}
            <div className="w-1/3 border-r border-white/10 pr-6 overflow-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-green-500" />
                    Ready for Recording
                </h2>
                <div className="space-y-2">
                    {readyItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => { setSelectedItem(item); setOptimization(null); }}
                            className={`p-3 rounded-lg cursor-pointer border ${selectedItem?.id === item.id ? "bg-green-500/10 border-green-500" : "bg-neutral-900 border-white/5 hover:border-white/20"}`}
                        >
                            <h3 className="font-medium text-sm">{item.title}</h3>
                            <div className="text-xs text-neutral-500 mt-1 flex justify-between">
                                <span>{item.script?.sections.length} Sections</span>
                                {item.script?.analysis && (
                                    <span className={item.script.analysis.totalScore > 80 ? "text-green-400" : "text-yellow-400"}>
                                        Score: {item.script.analysis.totalScore}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Teleprompter / Detail View */}
            <div className="w-2/3 pl-0 flex flex-col overflow-hidden">
                {selectedItem && selectedItem.script ? (
                    <div className="flex-col flex h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
                                    <button
                                        onClick={() => handleOptimize(selectedItem.title || "")}
                                        disabled={isOptimizing}
                                        className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20"
                                    >
                                        {isOptimizing ? "Optimizing..." : "Analyze CTR"}
                                    </button>
                                </div>

                                {optimization && (
                                    <div className="mb-4 bg-amber-900/10 border border-amber-500/20 rounded p-3 text-sm">
                                        <div className="font-bold text-amber-500 mb-2">CTR Optimization (Score: {optimization.score}/100)</div>
                                        <div className="space-y-1">
                                            {optimization.variations.map((v, i) => (
                                                <div key={i} className="flex justify-between group cursor-pointer hover:bg-amber-500/5 p-1 rounded">
                                                    <span className="text-white font-medium">{v.title}</span>
                                                    <span className="text-amber-400 text-xs">{v.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.script.analysis && (
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <div className="text-neutral-400">Burstiness: <span className="text-white">{selectedItem.script.analysis.metrics.burstiness}</span></div>
                                        <div className="text-neutral-400">Hook: <span className="text-white">{selectedItem.script.analysis.metrics.hook}</span></div>
                                        <div className="text-neutral-400">Voice: <span className="text-white">{selectedItem.script.analysis.metrics.voice}</span></div>
                                    </div>
                                )}
                            </div>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-500 flex items-center flex-shrink-0 ml-4">
                                <Play className="w-4 h-4 mr-2" />
                                Start Teleprompter
                            </button>
                        </div>

                        <div className="flex-1 bg-black border border-white/10 rounded-xl p-8 overflow-auto text-2xl leading-relaxed text-neutral-300 font-serif">
                            {selectedItem.script.sections.map((section, idx) => (
                                <div key={idx} className="mb-8">
                                    <h4 className="text-sm font-sans tracking-widest text-neutral-600 uppercase mb-2">{section.heading}</h4>
                                    <p>{section.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-neutral-500">
                        Select a script to view teleprompter
                    </div>
                )}
            </div>
        </div>
    );
}
