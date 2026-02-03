"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    X,
    Copy,
    Video,
    Mic,
    Image as ImageIcon,
    Upload,
    CheckCircle2,
    Clapperboard,
    Download,
    RefreshCw,
    Clock,
    FileText,
    Wand2,
    Music,
    Brain
} from "lucide-react";
import { NotebookItem } from "@/lib/notebook-types";
import { updateNotebookItemAction, regenerateAdaptationAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { generateProductionDocx, getDocxFilename } from "@/lib/docx-exporter";

interface BlueprintViewerProps {
    item: NotebookItem;
    onClose: () => void;
    onUpdateStatus: (newStatus: string) => void;
}

// Simple Parser to chunk the markdown
const parseBlueprint = (text: string) => {
    const defaultRes = {
        masterHook: "No master hook.",
        masterTwist: "No master twist.",
        masterStructure: "",
        masterGenius: "",
        masterAnalysis: "",
        hook: "No hook found.",
        twist: "No core value found.",
        outline: "",
        voiceOver: "",
        titles: "",
        thumbnails: [] as { content: string, code: string }[],
        videos: [] as { content: string, code: string }[],
        music: [] as { content: string, code: string }[],
        distribution: "", // Added distribution
    };

    if (!text) return defaultRes;

    // Split by main headers
    const parts = text.split(/^## /m);

    parts.forEach(part => {
        const lines = part.split("\n");
        const header = lines[0].trim().toUpperCase();
        const content = lines.slice(1).join("\n").trim();

        if (header.includes("MASTER HOOK")) defaultRes.masterHook = content;
        if (header.includes("MASTER TWIST")) defaultRes.masterTwist = content;
        if (header.includes("MASTER STRUCTURE")) defaultRes.masterStructure = content;
        if (header.includes("MASTER GENIUS")) defaultRes.masterGenius = content;
        if (header.includes("MASTER STRATEGY")) defaultRes.masterAnalysis = content;

        // Legacy/Adaptation mapping
        if (header.includes("VIRAL HOOK")) defaultRes.hook = content;
        if (header.includes("CORE VALUE")) defaultRes.twist = content;
        if (header.includes("SCRIPT OUTLINE")) defaultRes.outline = content;
        if (header.includes("VOICEOVER SCRIPT")) defaultRes.voiceOver = content;
        if (header.includes("TITLE IDEAS")) defaultRes.titles = content;
        if (header.includes("DISTRIBUTION PACKAGE")) defaultRes.distribution = content;

        if (header.includes("THUMBNAIL")) {
            // Extract prompts: Look for > Midjourney: `code`
            const promptBlocks = content.split("### ");
            promptBlocks.forEach(block => {
                const match = block.match(/Midjourney: `([^`]+)`/);
                if (match) {
                    defaultRes.thumbnails.push({
                        content: block.split(">")[0].trim(), // Description
                        code: match[1].replace(/\/imagine prompt:/gi, "").replace(/--ar \d+:\d+/g, "").replace(/--v [\d.]+/g, "").trim() // Cleaned Prompt
                    });
                }
            });
        }

        if (header.includes("VIDEO PROMPTS")) {
            // Extract prompts: Look for Meta AI: `code` or Runway: `code`
            const lines = content.split("\n");
            lines.forEach(line => {
                const match = line.match(/(?:Meta AI|Runway|Video): `([^`]+)`/);
                if (match) {
                    // Extract the [Action] part if it exists for the display text
                    const contentPart = line.split(/Meta AI:|Runway:|Video:/)[0].replace(/^- /, "").replace(/\[|\]/g, "").trim();
                    defaultRes.videos.push({
                        content: contentPart,
                        code: match[1]
                    });
                }
            });
        }

        if (header.includes("MUSIC PROMPTS")) {
            // Extract prompts: Look for Tunee: `code`
            const lines = content.split("\n");
            lines.forEach(line => {
                const match = line.match(/(?:Tunee|Music): `([^`]+)`/);
                if (match) {
                    const contentPart = line.split(/Tunee:|Music:/)[0].replace(/^- /, "").replace(/\[|\]/g, "").trim();
                    defaultRes.music.push({
                        content: contentPart,
                        code: match[1]
                    });
                }
            });
        }
    });

    return defaultRes;
};

export function BlueprintViewer({ item, onClose, onUpdateStatus }: BlueprintViewerProps) {
    const [activeTab, setActiveTab] = useState<"master" | "script" | "assets" | "meta">("master");
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<"30s" | "60s" | "Long">("60s");

    const sections = parseBlueprint(item.blueprint || "");

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(id);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const handleAdjustFormat = async () => {
        setIsAdjusting(true);
        try {
            await regenerateAdaptationAction(item.id, selectedFormat);
            // Wait for revalidation/refresh? The server action revalidates.
            // Ideally we'd get a signal back, but for now we rely on UI update via parent prop or similar.
            // For now, simple loading state.
        } catch (error) {
            console.error("Adjustment Failed", error);
        } finally {
            setIsAdjusting(false);
        }
    };

    const handleDownloadDocx = async () => {
        try {
            const blob = await generateProductionDocx(item.title, sections);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getDocxFilename("Production_Script", item.title);
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed", error);
        }
    };

    // Helper to extract specific sections (simple regex approach for now or just render whole thing)
    // For now, we will render the whole markdown but use custom components to inject buttons?
    // Actually, splitting the content by headers is better for the tabs.


    return (
        <div className="fixed top-0 right-0 bottom-0 left-[256px] z-[50] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-6xl h-[90vh] rounded-xl border border-border shadow-2xl flex flex-col relative animate-in slide-in-from-right-10 duration-300 overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b bg-muted/20 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Clapperboard className="w-6 h-6 text-primary" />
                                {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Production Cockpit &bull; {item.status}</p>
                        </div>
                        <div className="flex gap-2">
                            {/* Download Button (Visible on Script & Assets & Meta) */}
                            {activeTab !== "master" && (
                                <button
                                    onClick={handleDownloadDocx}
                                    className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-md text-sm font-bold flex items-center gap-2 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    Download Production DOCX
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Tabs */}
                    <div className="flex items-center justify-between bg-muted/50 p-1 rounded-lg">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab("master")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                                    activeTab === "master" ? "bg-background text-yellow-400 shadow" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Brain className="w-4 h-4" />
                                1. Mastermind
                            </button>
                            <button
                                onClick={() => setActiveTab("script")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                                    activeTab === "script" ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Mic className="w-4 h-4" />
                                2. Script (DE)
                            </button>
                            <button
                                onClick={() => setActiveTab("assets")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                                    activeTab === "assets" ? "bg-background text-purple-400 shadow" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Wand2 className="w-4 h-4" />
                                3. AI Assets
                            </button>
                            <button
                                onClick={() => setActiveTab("meta")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                                    activeTab === "meta" ? "bg-background text-green-400 shadow" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Upload className="w-4 h-4" />
                                4. Metadata
                            </button>
                        </div>

                        {/* Format Control (Only visible in Script Tab) */}
                        {activeTab === "script" && (
                            <div className="flex items-center gap-2 px-4 animate-in fade-in">
                                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Duration:
                                </span>
                                <select
                                    className="bg-black/20 border border-white/10 rounded text-xs px-2 py-1 text-white focus:outline-none focus:border-primary"
                                    value={selectedFormat}
                                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                                    disabled={isAdjusting}
                                >
                                    <option value="30s">Short (30s)</option>
                                    <option value="60s">Medium (60s)</option>
                                    <option value="Long">Longform</option>
                                </select>
                                <button
                                    onClick={handleAdjustFormat}
                                    disabled={isAdjusting}
                                    className="text-xs bg-primary/20 hover:bg-primary/40 text-primary px-3 py-1 rounded font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={cn("w-3 h-3", isAdjusting && "animate-spin")} />
                                    {isAdjusting ? "Adapting..." : "Adjust"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-zinc-950/50 relative">

                    {activeTab === "master" && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">

                            <div className="bg-card border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-xl shadow-sm">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-500 mb-4">
                                    <Brain className="w-6 h-6" /> The Master Blueprint (English)
                                </h3>
                                <p className="text-muted-foreground mb-6">This is the strategic core ("The Brain"). Format-agnostic and deep psychological analysis.</p>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-600 uppercase tracking-widest mb-2">Master Hook Logic</h4>
                                        <p className="text-lg leading-relaxed font-medium text-zinc-200">{sections.masterHook}</p>
                                    </div>
                                    <div className="h-px bg-yellow-500/20" />
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-600 uppercase tracking-widest mb-2">Core Twist Mechanism</h4>
                                        <p className="text-zinc-300">{sections.masterTwist}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                    <h4 className="text-lg font-bold border-b border-border pb-2 mb-4 text-zinc-300">Structural DNA</h4>
                                    <div className="prose prose-invert max-w-none text-sm text-zinc-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.masterStructure}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                    <h4 className="text-lg font-bold border-b border-border pb-2 mb-4 text-zinc-300">Genius Elements</h4>
                                    <div className="prose prose-invert max-w-none text-sm text-zinc-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.masterGenius}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                <h4 className="text-lg font-bold border-b border-border pb-2 mb-4 text-zinc-300">Strategy Analysis</h4>
                                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{sections.masterAnalysis}</p>
                            </div>

                        </div>
                    )}

                    {activeTab === "script" && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">

                            {/* Hook Section */}
                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-red-400">🔥 Viral Hook</h4>
                                    <button
                                        onClick={() => handleCopy(sections.hook, "hook")}
                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {copiedSection === "hook" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        Copy
                                    </button>
                                </div>
                                <p className="text-lg leading-relaxed font-medium">{sections.hook}</p>
                            </div>

                            {/* Core Value */}
                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">The Twist / Core Value</h4>
                                <p className="text-muted-foreground">{sections.twist}</p>
                            </div>

                            {/* Script Outline */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold border-b border-border pb-2">Director's Outline</h4>
                                <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-strong:text-white">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {sections.outline}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* VoiceOver Script with Copy */}
                            {sections.voiceOver && (
                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm mt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-cyan-400">🎙️ VoiceOver Script (Production Ready)</h4>
                                        <button
                                            onClick={() => handleCopy(sections.voiceOver, "voiceOver")}
                                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                        >
                                            {copiedSection === "voiceOver" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            Copy Script
                                        </button>
                                    </div>
                                    <div className="prose prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                                        {sections.voiceOver}
                                    </div>
                                </div>
                            )}

                            {/* Action: Move to Filming */}
                            {item.status === "Scripting" && (
                                <div className="sticky bottom-4 flex justify-center pt-8">
                                    <button
                                        onClick={() => onUpdateStatus("Filming")}
                                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        <Video className="w-6 h-6" />
                                        Start Filming Now
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "assets" && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Thumbnail Prompts */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                                        <ImageIcon className="w-5 h-5" /> Bilder-Prompts (Thumbnails)
                                    </h3>
                                    {sections.thumbnails.map((prompt, i) => (
                                        <div key={i} className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 group hover:border-purple-500/30 transition-colors">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="font-mono text-xs text-zinc-400 leading-relaxed flex-1" title={prompt.content}>
                                                    {prompt.content.length > 50 ? prompt.content.slice(0, 50) + "..." : prompt.content}
                                                </p>
                                                <button
                                                    onClick={() => handleCopy(prompt.code, `mj-${i}`)}
                                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-muted-foreground hover:text-white transition-colors"
                                                    title="Copy Prompt Only"
                                                >
                                                    {copiedSection === `mj-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Music Prompts */}
                                <div className="space-y-4 pt-8 border-t border-border/30">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                                        <Music className="w-5 h-5" /> Tunee.ai Prompts (Music)
                                    </h3>
                                    {sections.music.map((prompt, i) => (
                                        <div key={i} className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 group hover:border-cyan-500/30 transition-colors">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="font-mono text-xs text-zinc-400 leading-relaxed flex-1">{prompt.content}</p>
                                                <button
                                                    onClick={() => handleCopy(prompt.code, `tunee-${i}`)}
                                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-muted-foreground hover:text-white transition-colors"
                                                    title="Copy Prompt Only"
                                                >
                                                    {copiedSection === `tunee-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Video Prompts */}
                                <div className="space-y-4 pt-8 border-t border-border/30">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-pink-400">
                                            <Video className="w-5 h-5" /> Video-Prompts
                                        </h3>
                                        <button
                                            onClick={() => handleCopy(sections.videos.map(v => v.code).join("\n"), "all-videos")}
                                            className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                                        >
                                            {copiedSection === "all-videos" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            Copy ALL for Bulk Production
                                        </button>
                                    </div>

                                    {sections.videos.map((prompt, i) => (
                                        <div key={i} className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 group hover:border-pink-500/30 transition-colors">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="font-mono text-xs text-zinc-400 leading-relaxed flex-1" title={prompt.content}>
                                                    {prompt.content.length > 50 ? prompt.content.slice(0, 50) + "..." : prompt.content}
                                                </p>
                                                <button
                                                    onClick={() => handleCopy(prompt.code, `meta-${i}`)}
                                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-muted-foreground hover:text-white transition-colors"
                                                    title="Copy Prompt Only"
                                                >
                                                    {copiedSection === `meta-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action: Move to Polishing */}
                            {item.status === "Filming" && (
                                <div className="sticky bottom-4 flex justify-center pt-8">
                                    <button
                                        onClick={() => onUpdateStatus("Polishing")}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        <Wand2 className="w-6 h-6" />
                                        Start Editing (Polishing)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "meta" && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold text-green-400 mb-4">Optimized Titles & Description</h3>

                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
                                <h4 className="font-bold border-b border-border pb-2 mb-4 text-yellow-500">Title Options</h4>
                                <div className="prose prose-invert max-w-none prose-strong:text-amber-500 prose-li:text-zinc-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections.titles}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Action: Move to Ready */}
                            {(item.status === "Polishing" || item.status === "Filming") && (
                                <div className="sticky bottom-4 flex justify-center pt-8">
                                    <button
                                        onClick={() => {
                                            onUpdateStatus("Ready");
                                            onClose();
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                        Mark as Ready & Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


