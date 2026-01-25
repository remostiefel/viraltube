"use client";

import { useState } from "react";
import { analyzeViralVideoAction, saveTemplateAction, getTemplatesAction } from "../actions";
import { ViralAnalysisResult } from "@/lib/openai";
import { Loader2, Copy, Check, Info, Save, Book, Play, Activity, Layout, Eye, BrainCircuit } from "lucide-react";
import { Template } from "@/lib/templates";
import { NeuroScore } from "@/components/analysis/NeuroScore";
import { IdeationConsole } from "@/components/creative/IdeationConsole";

export default function IterativeLoopPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ViralAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedWord, setSelectedWord] = useState<{ keyword: string; explanation: string; category: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    // Human-in-the-Loop State
    const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
    const [editablePrompt, setEditablePrompt] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const toggleItemReview = (keyword: string) => {
        const newSet = new Set(reviewedItems);
        if (newSet.has(keyword)) newSet.delete(keyword);
        else newSet.add(keyword);
        setReviewedItems(newSet);
    };

    // Library State
    const [viewMode, setViewMode] = useState<"analyze" | "library" | "ideation">("ideation");
    const [libraryItems, setLibraryItems] = useState<Template[]>([]);

    const loadLibrary = async () => {
        const templates = await getTemplatesAction("viral-wisdom");
        setLibraryItems(templates.reverse()); // Newest first
    };

    const loadFromLibrary = (template: Template) => {
        // Handle legacy string vs new object structure
        if (typeof template.content === 'string') {
            setResult({
                wordwall: [], // Legacy items might lack wordwall
                optimizationPrompt: template.content
            });
        } else {
            setResult(template.content as ViralAnalysisResult);
        }
        setViewMode("analyze");
    };

    const handleSaveWisdom = async () => {
        if (!result) return;
        setSaving(true);
        try {
            // Filter the wordwall based on user selection
            const finalWordwall = result.wordwall.filter(w => reviewedItems.has(w.keyword));

            // Create the final approved result object
            const approvedResult: ViralAnalysisResult = {
                wordwall: finalWordwall,
                optimizationPrompt: editablePrompt // Use the edited prompt
            };

            const name = `Viral Wisdom: ${url.split('v=')[1]?.slice(0, 8) || 'Video'} Analysis`;

            await saveTemplateAction("viral-wisdom", name, approvedResult);
            alert("Viral Wisdom Injected into Neural Ops!");
        } catch (e) {
            console.error("Failed to save wisdom", e);
            alert("Failed to inject wisdom.");
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyze = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setSelectedWord(null);

        const res = await analyzeViralVideoAction(url);

        if (res && 'error' in res) {
            setError(res.error);
        } else if (res) {
            setResult(res);
            // Auto-select all items initially? Or let user pick? 
            // Let's auto-select all to minimize friction, so users only "Deselect" bad ones.
            setReviewedItems(new Set(res.wordwall.map(w => w.keyword)));
            setEditablePrompt(res.optimizationPrompt);
        }

        setLoading(false);
    };

    const copyPrompt = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.optimizationPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Iterative Loop
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Extract viral DNA from any YouTube video. Decode the hooks, pacing, and psychology—then re-inject it into your own content.
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={() => setViewMode("ideation")}
                            className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${viewMode === "ideation" ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                        >
                            <BrainCircuit className="w-4 h-4" /> Creative Loop
                        </button>
                        <button
                            onClick={() => setViewMode("analyze")}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${viewMode === "analyze" ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                        >
                            Analyze External
                        </button>
                        <button
                            onClick={() => { setViewMode("library"); loadLibrary(); }}
                            className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${viewMode === "library" ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                        >
                            <Book className="w-4 h-4" /> Neural Library
                        </button>
                    </div>

                    {/* Metaphysical Toggle (Hidden Layer) */}
                    <div className="flex justify-center mt-2 group">
                        <button
                            onClick={() => alert("Recursion Mode: The Output becomes the Input. (Feature active in subconscious)")}
                            className="text-[10px] text-gray-800 uppercase tracking-[0.3em] hover:text-purple-500 transition-colors duration-500"
                        >
                            ∞ Infinite Recursion Active
                        </button>
                    </div>
                </div>

                {viewMode === "ideation" ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8">
                        <IdeationConsole onOpenAnalysis={() => setViewMode("analyze")} />
                    </div>
                ) : viewMode === "analyze" ? (
                    <>
                        {/* Input Section */}
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <input
                                type="text"
                                placeholder="Paste Viral YouTube URL here..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !url}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" />}
                                {loading ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg text-center max-w-3xl mx-auto">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

                                {/* 1. Neuro-Score Visualization */}
                                {result.neuroScore && (
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <Activity className="w-6 h-6 text-blue-400" />
                                            </div>
                                            Neuro-Code Score
                                        </h2>
                                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                            <NeuroScore score={result.neuroScore} />
                                        </div>
                                    </div>
                                )}

                                {/* 2. Structural Analysis */}
                                {result.structureAnalysis && (
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                                <Layout className="w-6 h-6 text-purple-400" />
                                            </div>
                                            Viral Structure
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {result.structureAnalysis.map((phase, idx) => (
                                                <div key={idx} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20 group-hover:bg-purple-500 transition-colors" />
                                                    <div className="text-xs uppercase tracking-widest text-purple-400 font-bold pl-3">
                                                        Phase {idx + 1}: {phase.phase}
                                                    </div>
                                                    <div className="pl-3 text-gray-300 text-sm">
                                                        {phase.description}
                                                    </div>
                                                    <div className="pl-3 mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> Trigger: <span className="text-gray-400">{phase.visualTrigger}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Wordwall */}
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold flex items-center gap-3">
                                        <Info className="text-blue-400" /> Viral Wordwall
                                    </h2>
                                    <p className="text-gray-400">Click on a concept to reveal the secret behind its success.</p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {result.wordwall?.map((item, idx) => {
                                            const isSelected = reviewedItems.has(item.keyword);
                                            return (
                                                <div key={idx} className="relative group">
                                                    {/* Selection Checkbox (Dialog Feature) */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleItemReview(item.keyword); }}
                                                        className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? "bg-green-500 border-green-500" : "bg-gray-800 border-gray-600 hover:border-gray-400"}`}
                                                        title={isSelected ? "Included in Wisdom Core" : "Excluded"}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </button>

                                                    <button
                                                        onClick={() => setSelectedWord(item)}
                                                        className={`w-full p-6 rounded-xl border text-left transition-all hover:scale-105 active:scale-95 relative overflow-hidden h-full flex flex-col justify-between ${selectedWord?.keyword === item.keyword
                                                            ? "bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                                                            : isSelected
                                                                ? "bg-gray-900 border-gray-800 hover:border-gray-600"
                                                                : "bg-gray-900/40 border-gray-800/40 text-gray-600 grayscale"
                                                            }`}
                                                    >

                                                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest opacity-50 mb-4">
                                                            {item.category}
                                                        </div>
                                                        <div className={`text-xl font-bold ${isSelected ? "text-gray-200 group-hover:text-white" : "text-gray-600"}`}>
                                                            {item.keyword}
                                                        </div>
                                                    </button>
                                                </div>
                                            )
                                        }) || <p className="text-gray-500">No Wordwall data available for this analysis.</p>}
                                    </div>

                                    {/* Detailed Explanation Panel */}
                                    {selectedWord && (
                                        <div className="bg-gray-900/80 border border-gray-700 p-8 rounded-2xl mt-4 animate-in zoom-in-95 duration-200">
                                            <h3 className="text-2xl font-bold text-blue-400 mb-2">{selectedWord.keyword}</h3>
                                            <p className="text-gray-300 text-lg leading-relaxed">
                                                {selectedWord.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Optimization Prompt */}
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-purple-400">Optimization Prompt</h2>
                                    <div className="bg-gray-900 border border-purple-900/50 rounded-2xl p-8 relative group">
                                        <button
                                            onClick={copyPrompt}
                                            className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check className="text-green-400" /> : <Copy />}
                                        </button>

                                        <button
                                            onClick={handleSaveWisdom}
                                            disabled={saving}
                                            className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-500/50"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Inject to Neural Core
                                        </button>

                                        {isEditing ? (
                                            <textarea
                                                value={editablePrompt}
                                                onChange={(e) => setEditablePrompt(e.target.value)}
                                                className="w-full bg-gray-950/50 text-gray-300 font-mono text-sm leading-relaxed p-4 rounded-xl border border-purple-500/30 focus:border-purple-500 focus:outline-none min-h-[300px]"
                                            />
                                        ) : (
                                            <pre
                                                onClick={() => setIsEditing(true)}
                                                className="whitespace-pre-wrap font-mono text-gray-300 text-sm leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar pb-16 cursor-text hover:bg-gray-800/50 p-2 rounded transition-colors"
                                                title="Click to edit"
                                            >
                                                {editablePrompt}
                                            </pre>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm text-center">
                                        Copy this prompt and feed it back into the Neuro-Code Architect to apply these insights to your next script.
                                    </p>
                                </div>

                            </div>
                        )}
                    </>
                ) : (
                    /* LIBRARY VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8">
                        {libraryItems.length === 0 ? (
                            <div className="col-span-2 text-center text-gray-500 py-12">
                                No viral wisdom tokens found. Analyze a video and "Inject to Neural Core" to start building your library.
                            </div>
                        ) : (
                            libraryItems.map((item) => (
                                <div key={item.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-blue-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-gray-200 group-hover:text-blue-400 truncate pr-4">{item.name}</h3>
                                        <span className="text-xs text-gray-600 font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                                        {typeof item.content === 'string' ? item.content : item.content.optimizationPrompt}
                                    </p>
                                    <button
                                        onClick={() => loadFromLibrary(item)}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Play className="w-4 h-4" /> Load Insights
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
