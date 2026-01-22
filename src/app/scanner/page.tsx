"use client";

import { useState, useEffect } from "react";
import { Radar, Search, BookOpen, AlertCircle, TrendingUp, Zap, Target, ExternalLink, Calendar, Eye, Plus, Trash2, BrainCircuit, Library, Edit } from "lucide-react";
import { fetchScientificPapers } from "@/app/actions";
import { searchOutliersAction, createProjectAction, fetchChannelVideosAction, synthesizePaperAction, getProjectsAction } from "@/app/actions";
import { ScientificPaper, reconstructAbstract } from "@/lib/openalex";
import { OutlierVideo } from "@/lib/youtube";
import { WisdomNugget } from "@/lib/openai";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/projects";

export default function Scanner() {
    const router = useRouter();
    const [emulating, setEmulating] = useState("");

    // Collections State & Logic
    interface VideoCollection {
        id: string;
        name: string;
        date: string;
        videos: OutlierVideo[];
    }
    const [collections, setCollections] = useState<VideoCollection[]>([]);

    // Mode State (Updated Type)
    const [mode, setMode] = useState<"research" | "trend-scout" | "monitor" | "collections" | "strategies" | "wisdom">("trend-scout");
    const [query, setQuery] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);

    const loadProjects = async () => {
        const data = await getProjectsAction();
        setProjects(data);
    };

    // Research State
    const [papers, setPapers] = useState<ScientificPaper[]>([]);
    const [loadingResearch, setLoadingResearch] = useState(false);
    const [synthesizing, setSynthesizing] = useState("");

    // Trend Scout State
    const [outliers, setOutliers] = useState<OutlierVideo[]>([]);
    const [loadingScout, setLoadingScout] = useState(false);
    const [scoutSearched, setScoutSearched] = useState(false);


    // Wisdom Extraction State
    const [extractedNuggets, setExtractedNuggets] = useState<WisdomNugget[] | null>(null);
    const [selectedNuggetIndices, setSelectedNuggetIndices] = useState<Set<number>>(new Set());
    const [extractionTags, setExtractionTags] = useState("");
    const [extractionRating, setExtractionRating] = useState(5);
    const [extractionSourceId, setExtractionSourceId] = useState("");
    const [extractionLoading, setExtractionLoading] = useState(false);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [extractionMode, setExtractionMode] = useState<"LAW" | "FACT" | "GROWTH">("LAW"); // SEPARATION OF POWERS

    // Manual Input State
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualInputText, setManualInputText] = useState("");

    // Notification State
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Toggle Selection for Combo
    const toggleSelection = (videoId: string) => {
        setSelectedVideos(prev =>
            prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
        );
    };

    const toggleNuggetSelection = (index: number) => {
        const newSet = new Set(selectedNuggetIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedNuggetIndices(newSet);
    };

    // Emulate Combo
    const handleComboEmulation = async () => {
        if (selectedVideos.length < 2) return;
        setEmulating("combo");

        try {
            // 1. Gather selected video details
            let selectedOutliers: OutlierVideo[] = [];
            collections.forEach(col => {
                col.videos.forEach(v => {
                    if (selectedVideos.includes(v.id) && !selectedOutliers.some(so => so.id === v.id)) {
                        selectedOutliers.push(v);
                    }
                });
            });

            if (selectedOutliers.length === 0) {
                return;
            }

            // 2. Generate Combo Title & Description
            const titles = selectedOutliers.map(v => `"${v.title.slice(0, 15)}..."`).join(" + ");
            const projectTitle = `Combo: ${titles}`;

            const description = `
⚔️ COMBO STRATEGY

Please synthesize a new video format based on these high-performing outliers:

${selectedOutliers.map((v, i) => `
${i + 1}. ${v.title} (https://youtu.be/${v.id})
   - Performance: ${v.outlierScore}x
`).join("")}

GOAL: Combine the strongest hooks, pacing, and visual styles of these videos into a unique "Hybrid" format.
             `.trim();

            // 3. Create Project & Redirect
            const newProject = await createProjectAction(projectTitle, description);
            router.push(`/project/${newProject.id}`);

        } catch (e) {
            console.error(e);
            alert("Failed to create combo.");
        } finally {
            setEmulating("");
            setSelectedVideos([]);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem("nc_video_collections");
        if (saved) {
            setCollections(JSON.parse(saved));
        }
    }, []);

    const saveCollections = (cols: VideoCollection[]) => {
        setCollections(cols);
        localStorage.setItem("nc_video_collections", JSON.stringify(cols));
    };

    const handleBookmark = (video: OutlierVideo) => {
        // Toggle Logic: If saved, remove. If not, add.
        const isSaved = collections.some(c => c.videos.some(v => v.id === video.id));

        if (isSaved) {
            // Remove from ALL collections (Unsave)
            const updatedCols = collections.map(c => ({
                ...c,
                videos: c.videos.filter(v => v.id !== video.id)
            })).filter(c => c.videos.length > 0); // Clean up empty collections
            saveCollections(updatedCols);
        } else {
            // Add to Current Collection (Save)
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '');
            const cleanQuery = query.trim() || "General";
            const collectionId = `${dateStr}-${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const collectionName = `${dateStr} - ${cleanQuery}`;

            const existing = collections.find(c => c.id === collectionId);
            let updatedCols = [...collections];

            if (existing) {
                updatedCols = updatedCols.map(c => c.id === collectionId ? { ...c, videos: [...c.videos, video] } : c);
            } else {
                updatedCols = [
                    { id: collectionId, name: collectionName, date: now.toISOString(), videos: [video] },
                    ...updatedCols
                ];
            }

            saveCollections(updatedCols);
        }
    };

    const deleteCollection = (id: string) => {
        const updated = collections.filter(c => c.id !== id);
        saveCollections(updated);
    }

    const removeVideoFromCollection = (colId: string, videoId: string) => {
        const updated = collections.map(c => {
            if (c.id === colId) {
                return { ...c, videos: c.videos.filter(v => v.id !== videoId) };
            }
            return c;
        }).filter(c => c.videos.length > 0);
        saveCollections(updated);
    }

    // Viral Filters
    const [timeframe, setTimeframe] = useState<"month" | "year" | "all">("month");
    const [channelSize, setChannelSize] = useState<"underdog" | "rising" | "any">("underdog");

    // Monitor State
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [monitorVideos, setMonitorVideos] = useState<OutlierVideo[]>([]);
    const [newChannelId, setNewChannelId] = useState("");
    const [loadingMonitor, setLoadingMonitor] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("nc_watchlist");
        if (saved) {
            setWatchlist(JSON.parse(saved));
        }
    }, []);

    const saveWatchlist = (list: string[]) => {
        setWatchlist(list);
        localStorage.setItem("nc_watchlist", JSON.stringify(list));
    };

    const addChannel = () => {
        if (!newChannelId.trim()) return;
        if (watchlist.includes(newChannelId.trim())) return;
        const updated = [...watchlist, newChannelId.trim()];
        saveWatchlist(updated);
        setNewChannelId("");
        // Trigger refresh separately
    };

    const removeChannel = (id: string) => {
        const updated = watchlist.filter(c => c !== id);
        saveWatchlist(updated);
    };

    const refreshMonitor = async () => {
        if (watchlist.length === 0) return;
        setLoadingMonitor(true);
        setMonitorVideos([]);

        try {
            let allVideos: OutlierVideo[] = [];
            for (const channelId of watchlist) {
                const vids = await fetchChannelVideosAction(channelId);
                allVideos = [...allVideos, ...vids];
            }
            // Sort by date descending
            allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            setMonitorVideos(allVideos);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMonitor(false);
        }
    };

    // Auto-refresh when entering monitor mode
    useEffect(() => {
        if (mode === "monitor" && watchlist.length > 0 && monitorVideos.length === 0) {
            refreshMonitor();
        }
    }, [mode]);

    const handleResearchSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loadingResearch) return;
        setLoadingResearch(true);
        try {
            const results = await fetchScientificPapers(query);
            setPapers(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingResearch(false);
        }
    };

    const [errorMsg, setErrorMsg] = useState("");

    const handleTrendScoutSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loadingScout) return;
        setLoadingScout(true);
        setOutliers([]);
        setScoutSearched(true);
        setErrorMsg(""); // Reset error

        try {
            // Calculate Date
            let publishedAfter: string | undefined;
            const now = new Date();
            if (timeframe === "month") {
                now.setMonth(now.getMonth() - 1);
                publishedAfter = now.toISOString();
            } else if (timeframe === "year") {
                now.setFullYear(now.getFullYear() - 1);
                publishedAfter = now.toISOString();
            }

            // Calculate Max Subs
            let maxSubs: number | undefined;
            if (channelSize === "underdog") maxSubs = 50000;
            else if (channelSize === "rising") maxSubs = 500000;

            const results = await searchOutliersAction(query, publishedAfter, maxSubs);
            setOutliers(results);
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Failed to fetch outliers. Try again.");
        } finally {
            setLoadingScout(false);
        }
    };

    const handleEmulate = async (video: OutlierVideo) => {
        if (emulating) return;
        setEmulating(video.id);
        try {
            // Create a project based on this viral hit
            const title = `Emulation: ${video.title.slice(0, 30)}...`;
            await createProjectAction(title, `Emulated Format: ${video.title}`);

            router.push("/"); // Go to Dashboard to see it
        } catch (e) {
            console.error(e);
        } finally {
            setEmulating("");
        }
    };

    const handleSynthesize = async (paper: ScientificPaper) => {
        if (synthesizing) return;
        setSynthesizing(paper.id);

        try {
            const abstract = paper.abstract_inverted_index
                ? reconstructAbstract(paper.abstract_inverted_index)
                : "Abstract unavailable";

            const overrides = localStorage.getItem("nc_prompts_override");
            const short = await synthesizePaperAction(
                abstract,
                paper.title,
                undefined, // Profile (optional)
                overrides ? JSON.parse(overrides) : undefined
            );

            const description = `
🔬 SCIENCE SHORT:
HOOK: ${short.hook}
FACT: ${short.coreFact}
EXPLANATION: ${short.explanation}
VISUAL: ${short.visualIdea}
CITATION: ${short.citation}

📜 FORMATTED SCRIPT:
${short.formattedScript || "N/A"}

🎙️ VOICEOVER (PLAIN TEXT):
${short.voiceOver || "N/A"}
            `.trim();

            await createProjectAction(`Short: ${short.coreFact.slice(0, 30)}...`, description);
            alert("Scientific Short Created in Timeline!");
            router.push("/");

        } catch (e) {
            console.error(e);
            alert("Failed to synthesize.");
        } finally {
            setSynthesizing("");
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#38BDF8] flex items-center gap-3">
                        <Radar className="w-8 h-8" />
                        Scanner
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Analyze viral content and extract winning patterns.
                    </p>
                </div>

                {/* Navigation Tabs - Reordered */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setMode("trend-scout")}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap", mode === "trend-scout" ? "bg-[#2DD4BF] text-black" : "bg-card hover:bg-muted")}
                    >
                        <TrendingUp className="w-3.5 h-3.5" /> Trend Scout
                    </button>
                    <button
                        onClick={() => setMode("wisdom")}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap", mode === "wisdom" ? "bg-yellow-500 text-black" : "bg-card hover:bg-muted")}
                    >
                        <Zap className="w-3.5 h-3.5" /> Wisdom
                    </button>
                    <button
                        onClick={() => setMode("research")}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap", mode === "research" ? "bg-[#4ADE80] text-black" : "bg-card hover:bg-muted")}
                    >
                        <BrainCircuit className="w-3.5 h-3.5" /> Research
                    </button>
                    <button
                        onClick={() => setMode("collections")}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap relative", mode === "collections" ? "bg-[#FDE68A] text-black" : "bg-card hover:bg-muted")}
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Collections
                        {collections.length > 0 && <span className="ml-1 bg-black/10 px-1 py-0.5 rounded-full text-[9px]">{collections.length}</span>}
                    </button>
                    <button
                        onClick={() => { setMode("strategies"); loadProjects(); }}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap", mode === "strategies" ? "bg-[#EC4899] text-white" : "bg-card hover:bg-muted")}
                    >
                        <Library className="w-3.5 h-3.5" /> Fusion Deck
                    </button>
                    <button
                        onClick={() => setMode("monitor")}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap", mode === "monitor" ? "bg-purple-900/50 text-purple-200 border border-purple-500/50" : "bg-card hover:bg-muted")}
                    >
                        <Eye className="w-3.5 h-3.5" /> Monitor
                    </button>
                </div>
            </div>

            {/* --- RESEARCH MODE --- */}
            {mode === "research" && (
                <div className="space-y-8">
                    <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg">
                        <form onSubmit={handleResearchSearch} className="flex gap-4">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search topic (e.g. Dopamine Fasting)..."
                                className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                type="submit"
                                disabled={loadingResearch || !query}
                                className="bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loadingResearch ? <Radar className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                Scan Data
                            </button>
                        </form>
                    </div>




                    <div className="grid gap-4">
                        {papers.map((paper) => (
                            <div key={paper.id} className="bg-card/50 border border-border/40 p-6 rounded-xl hover:bg-card hover:border-primary/40 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded">
                                                <Calendar className="w-3 h-3" /> {paper.publication_year}
                                            </span>
                                            <span className="text-secondary">{paper.host_venue?.display_name || "Unknown Venue"}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground leading-tight">
                                            {paper.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {paper.abstract_inverted_index
                                                ? reconstructAbstract(paper.abstract_inverted_index).slice(0, 300) + "..."
                                                : "No abstract preview available. Click to read source."}
                                        </p>
                                    </div>
                                    <div className="text-right min-w-[100px]">
                                        <span className="block text-2xl font-bold text-foreground">{paper.cited_by_count}</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Citations</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                                    <button
                                        onClick={() => handleSynthesize(paper)}
                                        disabled={!!synthesizing}
                                        className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-xs"
                                    >
                                        {synthesizing === paper.id ? <Zap className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                        Synthesize Short
                                    </button>

                                    <span className="text-muted-foreground">Authors: {paper.authorships.map(a => a.author.display_name).slice(0, 3).join(", ")}</span>
                                    {paper.open_access?.is_oa && (
                                        <a
                                            href={paper.open_access.oa_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ml-auto text-primary hover:underline flex items-center gap-1"
                                        >
                                            Read Full Paper <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                    {!paper.open_access?.is_oa && paper.doi && (
                                        <a
                                            href={paper.doi}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ml-auto text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                                        >
                                            View DOI <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div >
            )}

            {/* --- WISDOM EXTRACTION MODE --- */}
            {mode === "wisdom" && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" /> Meta-Analysis (Extract Wisdom in German)
                        </h3>

                        {!extractedNuggets ? (
                            <>
                                <div className="space-y-4 mb-4">
                                    <div className="flex gap-2 bg-black/20 p-1 rounded-lg w-max">
                                        <button
                                            onClick={() => setExtractionMode("LAW")}
                                            className={cn(
                                                "px-4 py-2 text-sm font-bold rounded-md transition-all",
                                                extractionMode === "LAW"
                                                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                <span>Strategy Audit (Laws)</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setExtractionMode("GROWTH")}
                                            className={cn(
                                                "px-4 py-2 text-sm font-bold rounded-md transition-all",
                                                extractionMode === "GROWTH"
                                                    ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                <span>Creator Growth (Meta)</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setExtractionMode("FACT")}
                                            className={cn(
                                                "px-4 py-2 text-sm font-bold rounded-md transition-all",
                                                extractionMode === "FACT"
                                                    ? "bg-green-600/20 text-green-400 border border-green-500/30"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                <span>Topic Research (Facts)</span>
                                            </div>
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {extractionMode === "LAW"
                                            ? "Extracts TIMELESS PRINCIPLES (Hooks, Pacing). Become Universal Laws in God Mode."
                                            : extractionMode === "GROWTH"
                                                ? "Extracts CREATOR STRATEGY (Mindset, Algo, Career). For YOU, not the script."
                                                : "Extracts FACTS & PROTOCOLS (e.g. Health Science). Saved to Knowledge Base only."}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Paste Educational Video URL..."
                                        className="flex-1 bg-muted/30 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        id="wisdom-input"
                                    />
                                    <button
                                        onClick={async () => {
                                            const input = document.getElementById('wisdom-input') as HTMLInputElement;
                                            const url = input.value;
                                            if (!url) return;

                                            try {
                                                setExtractionLoading(true);
                                                input.disabled = true;
                                                const { extractWisdomFromVideoUrlAction } = await import("@/app/actions");

                                                // 1. Extract Wisdom from URL (German)
                                                // @ts-ignore
                                                const nuggets = await extractWisdomFromVideoUrlAction(url, "DE", extractionMode);

                                                if (!nuggets || nuggets.length === 0) {
                                                    alert("Could not extract wisdom. Check the URL.");
                                                    setExtractionLoading(false);
                                                    input.disabled = false;
                                                    return;
                                                }

                                                const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : "Video";
                                                setExtractionSourceId(videoId);
                                                setExtractedNuggets(nuggets);
                                                // Select all by default
                                                setSelectedNuggetIndices(new Set(nuggets.map((_, i) => i)));

                                                let tags = "Research, Knowledge";
                                                if (extractionMode === "LAW") tags = "Wisdom, Strategy";
                                                if (extractionMode === "GROWTH") tags = "Growth, Mindset, Creator";

                                                setExtractionTags(tags);
                                            } catch (e: any) {
                                                console.error(e);
                                                alert(`Analysis failed: ${e.message}`);
                                            } finally {
                                                setExtractionLoading(false);
                                                input.disabled = false;
                                            }
                                        }}
                                        disabled={extractionLoading}
                                        className={cn(
                                            "font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2",
                                            extractionMode === "LAW"
                                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                                : extractionMode === "GROWTH"
                                                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                                    : "bg-green-600 text-white hover:bg-green-700"
                                        )}
                                    >
                                        {extractionLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        Extract {extractionMode === "LAW" ? "Laws" : extractionMode === "GROWTH" ? "Growth" : "Facts"}
                                    </button>

                                    {/* Manual Input Trigger */}
                                    <button
                                        onClick={() => {
                                            const text = prompt("Paste your transcript, notes, or summary here (min 50 chars):");
                                            if (!text || text.length < 50) {
                                                if (text) alert("Text too short!");
                                                return;
                                            }

                                            // Handle Manual Extraction (Inline for speed)
                                            (async () => {
                                                try {
                                                    setExtractionLoading(true);
                                                    const { extractWisdomFromTextAction } = await import("@/app/actions");
                                                    // @ts-ignore
                                                    const nuggets = await extractWisdomFromTextAction(text, "DE", extractionMode);

                                                    if (!nuggets) throw new Error("No wisdom found in text.");

                                                    setExtractionSourceId("Manual Input");
                                                    setExtractedNuggets(nuggets);
                                                    // Select all by default
                                                    setSelectedNuggetIndices(new Set(nuggets.map((_, i) => i)));
                                                    let tags = "Manual, Research";
                                                    if (extractionMode === "LAW") tags = "Wisdom, Strategy, Manual";
                                                    if (extractionMode === "GROWTH") tags = "Growth, Mindset, Creator, Manual";
                                                    setExtractionTags(tags);
                                                } catch (e: any) {
                                                    alert("Manual Error: " + e.message);
                                                } finally {
                                                    setExtractionLoading(false);
                                                }
                                            })();
                                        }}
                                        disabled={extractionLoading}
                                        className="bg-muted hover:bg-muted/80 text-foreground font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-border/50"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Manual Input
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                    <h4 className="font-bold text-white">Review & Save Concentrate</h4>
                                    <button
                                        onClick={() => setExtractedNuggets(null)}
                                        className="text-xs text-muted-foreground hover:text-white"
                                    >
                                        Discard
                                    </button>
                                </div>

                                {/* Editable Nuggets */}
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {extractedNuggets.map((nugget, idx) => {
                                        const isSelected = selectedNuggetIndices.has(idx);
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => toggleNuggetSelection(idx)}
                                                className={cn(
                                                    "bg-background/40 p-3 rounded-lg border space-y-2 cursor-pointer transition-all",
                                                    isSelected ? "border-white/20 ring-1 ring-white/10 opacity-100" : "border-transparent opacity-40 grayscale hover:opacity-60"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <input
                                                        value={nugget.principle}
                                                        onClick={(e) => e.stopPropagation()} // Prevent toggle on input click
                                                        onChange={(e) => {
                                                            const newNuggets = [...extractedNuggets];
                                                            newNuggets[idx].principle = e.target.value;
                                                            setExtractedNuggets(newNuggets);
                                                        }}
                                                        className="w-full bg-transparent font-bold text-yellow-500 focus:outline-none"
                                                        placeholder="Principle Name"
                                                    />
                                                    {isSelected && <div className="text-green-500 text-xs font-bold">✓ SAVE</div>}
                                                </div>
                                                <textarea
                                                    value={nugget.explanation}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        const newNuggets = [...extractedNuggets];
                                                        newNuggets[idx].explanation = e.target.value;
                                                        setExtractedNuggets(newNuggets);
                                                    }}
                                                    className="w-full bg-transparent text-sm text-muted-foreground resize-none focus:outline-none h-16"
                                                    placeholder="Explanation..."
                                                />
                                                <div className="flex gap-2 items-center bg-black/20 p-2 rounded">
                                                    <Target className="w-3 h-3 text-green-400" />
                                                    <input
                                                        value={nugget.actionableTip}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            const newNuggets = [...extractedNuggets];
                                                            newNuggets[idx].actionableTip = e.target.value;
                                                            setExtractedNuggets(newNuggets);
                                                        }}
                                                        className="w-full bg-transparent text-xs text-green-400/80 focus:outline-none"
                                                        placeholder="Actionable Tip..."
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Metadata Input */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Tags</label>
                                        <input
                                            value={extractionTags}
                                            onChange={(e) => setExtractionTags(e.target.value)}
                                            placeholder="e.g. #Hook, #Retention"
                                            className="w-full bg-background/50 border border-border/50 rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Impact Rating (1-5)</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => setExtractionRating(star)}
                                                    className={cn("w-8 h-8 rounded flex items-center justify-center transition-colors",
                                                        extractionRating >= star ? "bg-yellow-500 text-black font-bold" : "bg-muted/30 text-muted-foreground"
                                                    )}
                                                >
                                                    {star}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            const { saveTemplateAction } = await import("@/app/actions");

                                            // Format tags
                                            const tagsArray = extractionTags.split(",").map(t => t.trim()).filter(t => t);

                                            // Filter nuggets by selection
                                            const nuggetsToSave = extractedNuggets.filter((_, i) => selectedNuggetIndices.has(i));

                                            if (nuggetsToSave.length === 0) {
                                                alert("Please select at least one nugget to save.");
                                                return;
                                            }

                                            // Loop through and save each nugget individually
                                            for (const nugget of nuggetsToSave) {
                                                const principleName = nugget.principle || "Unknown Principle";
                                                await saveTemplateAction(
                                                    "viral-wisdom",
                                                    `Wisdom: ${principleName.substring(0, 30)}...`, // Better name
                                                    [nugget], // Save as array of 1 for consistency
                                                    undefined,
                                                    tagsArray,
                                                    extractionRating,
                                                    extractionMode // PASS THE CORRECT MODE
                                                );
                                            }

                                            setSaveSuccess(true);
                                            setTimeout(() => setSaveSuccess(false), 3000); // Auto-hide after 3s

                                            setExtractedNuggets(null);
                                            setExtractionTags("");
                                            setExtractionSourceId("");
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to save to pool.");
                                        }
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Library className="w-5 h-5" /> Save to Wisdom Pool
                                </button>

                                {/* Success Notification */}
                                {saveSuccess && (
                                    <div className="absolute bottom-full mb-4 left-0 right-0 bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-green-500 rounded-full p-1">
                                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-bold">Success! Wisdom Pool Updated.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}






            {/* --- TREND SCOUT MODE --- */}
            {
                mode === "trend-scout" && (
                    <div className="space-y-8">
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 shadow-lg space-y-4">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
                                    <span className="text-muted-foreground">Timeframe:</span>
                                    <select
                                        className="bg-transparent font-bold focus:outline-none"
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value as any)}
                                    >
                                        <option value="month">Last Month (Viral)</option>
                                        <option value="year">Last Year</option>
                                        <option value="all">All Time</option>
                                    </select>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
                                    <span className="text-muted-foreground">Channel Size:</span>
                                    <select
                                        className="bg-transparent font-bold focus:outline-none"
                                        value={channelSize}
                                        onChange={(e) => setChannelSize(e.target.value as any)}
                                    >
                                        <option value="underdog">Underdog (&lt; 50k)</option>
                                        <option value="rising">Rising Star (&lt; 500k)</option>
                                        <option value="any">Any Size</option>
                                    </select>
                                </label>
                            </div>

                            <form onSubmit={handleTrendScoutSearch} className="flex gap-4">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search US Niche (e.g. Biohacking, Productivity)..."
                                    className="flex-1 bg-muted/30 border border-green-500/30 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                />
                                <button
                                    type="submit"
                                    disabled={loadingScout || !query}
                                    className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {loadingScout ? <TrendingUp className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    Find Outliers
                                </button>
                            </form>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-bold">{errorMsg}</p>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {outliers.map((video) => (
                                <div key={video.id} className="bg-card/50 border border-border/40 rounded-xl overflow-hidden group hover:border-green-500/50 transition-all relative flex flex-col">
                                    <div className="relative aspect-video">
                                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 bg-black/80 text-green-400 border border-green-500/50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            {video.outlierScore}x Perf
                                        </div>
                                        {(() => {
                                            const isSaved = collections.some(c => c.videos.some(v => v.id === video.id));
                                            return (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBookmark(video); }}
                                                    className={cn(
                                                        "absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1",
                                                        isSaved
                                                            ? "text-yellow-400 border border-yellow-500/50"
                                                            : "text-gray-400 border border-gray-500/50 hover:text-gray-200"
                                                    )}
                                                >
                                                    {isSaved ? "⭐ Saved" : "☆ Save"}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                    <div className="p-4 space-y-3 flex flex-col flex-1">
                                        <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-green-400 transition-colors">
                                            {video.title}
                                        </h3>
                                        <div className="text-xs text-muted-foreground flex justify-between items-center">
                                            <span>{video.channelTitle}</span>
                                            <span className="font-mono">{new Date(video.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs bg-muted/20 p-2 rounded flex justify-between font-mono text-muted-foreground">
                                            <span>Sub: {(video.channelSubs / 1000).toFixed(0)}k</span>
                                            <span>View: {(video.viewCount / 1000).toFixed(0)}k</span>
                                        </div>

                                        <div className="flex-1"></div>

                                        <button
                                            onClick={() => handleEmulate(video)}
                                            disabled={!!emulating}
                                            className="w-full mt-2 bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {emulating === video.id ? <Target className="w-4 h-4 animate-pulse" /> : <Target className="w-4 h-4" />}
                                            Emulate Format
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {outliers.length === 0 && !loadingScout && mode === "trend-scout" && (
                                <div className="col-span-full text-center py-12 text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                                    {scoutSearched ? (
                                        <>
                                            <AlertCircle className="w-12 h-12 text-yellow-500" />
                                            <p>No high-performance outliers found for this topic.</p>
                                            <p className="text-xs">Try broader terms (e.g. "Dopamine" instead of "Dopamine Video").</p>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="w-12 h-12" />
                                            <p>Search for US niches to find viral outliers.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* --- COLLECTIONS MODE --- */}
            {
                mode === "collections" && (
                    <div className="space-y-8">
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-yellow-500 mb-2">My Curated Collections</h3>
                            <p className="text-muted-foreground">Viral bookmarks organized by search session.</p>
                        </div>

                        {collections.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                No collections yet. Use "Trend Scout" and click ⭐ Save on videos.
                            </div>
                        )}

                        <div className="space-y-12">
                            {collections.map(col => (
                                <div key={col.id} className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                        <h4 className="text-xl font-bold flex items-center gap-2">
                                            <span className="text-yellow-500">📁</span>
                                            {col.name}
                                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">{col.videos.length} videos</span>
                                        </h4>
                                        <button onClick={() => deleteCollection(col.id)} className="text-muted-foreground hover:text-red-500 text-xs flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Delete List
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {col.videos.map(video => (
                                            <div
                                                key={video.id}
                                                className={cn(
                                                    "bg-card/50 border rounded-lg overflow-hidden group transition-all text-sm relative cursor-pointer",
                                                    selectedVideos.includes(video.id) ? "border-yellow-500 bg-yellow-500/10" : "border-border/40 hover:border-yellow-500/50"
                                                )}
                                                onClick={() => toggleSelection(video.id)}
                                            >
                                                <div className="absolute top-2 left-2 z-10">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                        selectedVideos.includes(video.id) ? "bg-yellow-500 border-yellow-500 text-black" : "bg-black/50 border-white/50"
                                                    )}>
                                                        {selectedVideos.includes(video.id) && <Plus className="w-3 h-3" />}
                                                    </div>
                                                </div>

                                                <div className="relative aspect-video">
                                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 right-1 bg-black/80 text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                        {video.outlierScore}x
                                                    </div>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    <h5 className="font-bold line-clamp-2">{video.title}</h5>
                                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                                        <span>{video.channelTitle}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeVideoFromCollection(col.id, video.id); }}
                                                            className="hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Combo Floating Action Bar */}
                        {selectedVideos.length > 0 && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{selectedVideos.length} Selected</span>
                                    <span>{selectedVideos.length < 2 ? "Select one more to combine!" : "Ready for Fusion"}</span>
                                </div>
                                {selectedVideos.length >= 2 && (
                                    <button
                                        onClick={handleComboEmulation}
                                        disabled={!!emulating}
                                        className="bg-black text-yellow-500 hover:bg-black/80 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all"
                                    >
                                        {emulating === "combo" ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        Emulate Combo Format
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )
            }

            {/* --- MONITOR MODE --- */}
            {
                mode === "monitor" && (
                    <div className="space-y-8">
                        {/* Watchlist Manager */}
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6 shadow-lg">
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                                    <Eye className="w-5 h-5" /> Target Channels
                                </h3>
                                <div className="flex gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={newChannelId}
                                        onChange={(e) => setNewChannelId(e.target.value)}
                                        placeholder="Enter Channel ID (e.g. UC_x5...)"
                                        className="flex-1 bg-muted/30 border border-purple-500/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button
                                        onClick={addChannel}
                                        className="bg-purple-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                    <button
                                        onClick={refreshMonitor}
                                        className="bg-muted text-foreground font-bold px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {watchlist.map(id => (
                                    <div key={id} className="bg-background border border-border px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                        <span className="font-mono">{id}</span>
                                        <button onClick={() => removeChannel(id)} className="text-muted-foreground hover:text-red-500">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {watchlist.length === 0 && <span className="text-sm text-muted-foreground italic">Add channel IDs to monitor their latest uploads.</span>}
                            </div>
                        </div>

                        {/* Feed */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {monitorVideos.map((video) => (
                                <div key={video.id} className="bg-card/50 border border-border/40 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all relative flex flex-col">
                                    <div className="relative aspect-video">
                                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 bg-black/80 text-purple-400 border border-purple-500/50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {(video.viewCount / 1000).toFixed(0)}k Views
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 flex flex-col flex-1">
                                        <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
                                            {video.title}
                                        </h3>
                                        <div className="text-xs text-muted-foreground flex justify-between items-center">
                                            <span>{video.channelTitle}</span>
                                            <span className="font-mono">{new Date(video.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex-1"></div>

                                        <button
                                            onClick={() => handleEmulate(video)}
                                            disabled={!!emulating}
                                            className="w-full mt-2 bg-purple-600/10 text-purple-500 border border-purple-600/20 hover:bg-purple-600 hover:text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {emulating === video.id ? <Target className="w-4 h-4 animate-pulse" /> : <Target className="w-4 h-4" />}
                                            Deconstruct Logic
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {monitorVideos.length === 0 && !loadingMonitor && mode === "monitor" && watchlist.length > 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                                    <Eye className="w-12 h-12" />
                                    <p>Click Refresh to load videos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* --- STRATEGY DECK MODE --- */}
            {
                mode === "strategies" && (
                    <div className="space-y-8">
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6 shadow-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-purple-500 mb-2">The Fusion Deck</h3>
                                    <p className="text-muted-foreground">Synthesized strategies and combo formats.</p>
                                </div>
                                <button onClick={loadProjects} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.filter(p => p.title.includes("Combo") || p.format).map(p => (
                                <div key={p.id} className="bg-card/50 border border-purple-500/30 rounded-xl p-6 hover:shadow-lg hover:border-purple-500/60 transition-all cursor-pointer group" onClick={() => router.push(`/architect?project=${p.id}`)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:text-purple-300 transition-colors">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <h4 className="font-bold text-lg mb-2 line-clamp-2">{p.title}</h4>
                                    <div className="text-xs text-muted-foreground flex justify-between items-center mt-4 pt-4 border-t border-border/30">
                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                        <span className="bg-purple-500/10 text-purple-300 px-2 py-1 rounded">Strategy Concept</span>
                                    </div>
                                </div>
                            ))}
                            {projects.filter(p => p.title.includes("Combo") || p.format).length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground opacity-50">
                                    <BrainCircuit className="w-12 h-12 mx-auto mb-4" />
                                    <p>No specific strategy concepts found.</p>
                                    <p className="text-sm">Create "Combo Strategies" in Collections to populate this deck.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            {/* Manual Input Modal */}
            {
                showManualInput && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-[#1a1a1a] border border-border w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-purple-400" />
                                    Manual Analysis Input
                                </h3>
                                <button onClick={() => setShowManualInput(false)} className="text-muted-foreground hover:text-white">✕</button>
                            </div>

                            <div className="p-6 flex-1 overflow-auto">
                                <label className="block text-sm text-muted-foreground mb-2">
                                    Paste Transcript, Notes, or Summary here (min 50 chars):
                                </label>
                                <textarea
                                    className="w-full h-64 bg-black/50 border border-border/50 rounded-lg p-4 text-sm focus:outline-none focus:border-purple-500 resize-none font-mono"
                                    placeholder="Paste text here..."
                                    value={manualInputText}
                                    onChange={(e) => setManualInputText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {manualInputText.length} chars
                                </p>
                            </div>

                            <div className="p-4 border-t border-border bg-black/20 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowManualInput(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (manualInputText.length < 50) {
                                            alert("Text is too short (min 50 chars).");
                                            return;
                                        }

                                        try {
                                            setExtractionLoading(true);
                                            const { extractWisdomFromTextAction } = await import("@/app/actions");
                                            // @ts-ignore
                                            const nuggets = await extractWisdomFromTextAction(manualInputText, "DE", extractionMode);

                                            if (!nuggets) throw new Error("No wisdom found in text.");

                                            setExtractionSourceId("Manual Input");
                                            setExtractedNuggets(nuggets);

                                            let tags = "Manual, Research";
                                            if (extractionMode === "LAW") tags = "Wisdom, Strategy, Manual";
                                            if (extractionMode === "GROWTH") tags = "Growth, Mindset, Creator, Manual";
                                            setExtractionTags(tags);

                                            setShowManualInput(false);
                                            setManualInputText(""); // Reset
                                        } catch (e: any) {
                                            alert("Manual Analysis Error: " + e.message);
                                        } finally {
                                            setExtractionLoading(false);
                                        }
                                    }}
                                    disabled={extractionLoading}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                >
                                    {extractionLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    Analyze Text
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
