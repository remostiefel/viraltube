"use client";

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, TrendingUp, Lightbulb, GraduationCap, Edit, Trash2, Archive, ArrowRightLeft, Eye, X, FileDown } from "lucide-react";
import { getTemplatesAction, deleteTemplateAction, updateWisdomTypeAction, toggleArchiveStatusAction } from "@/app/actions";
import { Template } from "@/lib/templates";
import { WisdomNugget } from "@/lib/openai";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const dynamic = "force-dynamic";

export default function WisdomHub() {
    const searchParams = useSearchParams();
    const [wisdoms, setWisdoms] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Workbench State
    const [stagedNuggets, setStagedNuggets] = useState<any[]>([]);
    const [draftPrinciple, setDraftPrinciple] = useState<WisdomNugget | null>(null);
    const [draftTitle, setDraftTitle] = useState("");
    const [consolidating, setConsolidating] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewingNugget, setViewingNugget] = useState<Template | null>(null);
    const [exportingDocx, setExportingDocx] = useState(false);

    const [filterMode, setFilterMode] = useState<"ALL" | "LAW" | "GROWTH" | "FACT" | "ARCHIVED">("ALL"); // SEPARATION OF POWERS

    useEffect(() => {
        const filterParam = searchParams.get("filter");
        if (filterParam) {
            const mode = filterParam.toUpperCase();
            if (["LAW", "GROWTH", "FACT"].includes(mode)) {
                setFilterMode(mode as any);
            }
        }
        loadWisdom();
    }, [searchParams]);

    const loadWisdom = async () => {
        setLoading(true);
        try {
            const temps = await getTemplatesAction("viral-wisdom", undefined);
            setWisdoms(temps);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchDelete = () => {
        setDeleteDialogOpen(true);
    };

    const executeBatchDelete = async () => {
        setLoading(true);
        try {
            for (const id of selectedIds) {
                await deleteTemplateAction(id);
            }
            setSelectedIds([]);
            await loadWisdom();
        } catch (e) {
            console.error("Delete failed", e);
            alert("Deletion failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBatchArchive = async (archive: boolean) => {
        setLoading(true);
        for (const id of selectedIds) {
            await toggleArchiveStatusAction(id, archive);
        }
        setSelectedIds([]);
        await loadWisdom();
    };

    const handleBatchMove = async (targetType: "LAW" | "FACT" | "GROWTH") => {
        setLoading(true);
        try {
            for (const id of selectedIds) {
                console.log(`Moving ${id} to ${targetType}`);
                await updateWisdomTypeAction(id, targetType);
            }
            // Small delay to ensure FS write propagation
            await new Promise(resolve => setTimeout(resolve, 500));

            setSelectedIds([]);
            await loadWisdom();
        } catch (e) {
            console.error("Move failed", e);
            alert("Move failed.");
            setLoading(false);
        }
    };

    const handlePreviewConsolidate = async () => {
        if (selectedIds.length < 2) return;
        setConsolidating(true);
        try {
            const { previewConsolidationAction } = await import("@/app/actions");
            const result = await previewConsolidationAction(selectedIds);

            if (result && result.length > 0) {
                // Set the FIRST synthesized principle as the draft to edit
                setDraftPrinciple(result[0]);
                setDraftTitle("Master Principle: " + result[0].principle.substring(0, 30));
            }
        } catch (e) {
            console.error(e);
            alert("Consolidation preview failed.");
        } finally {
            setConsolidating(false);
        }
    };

    const [draftCategory, setDraftCategory] = useState<"LAW" | "FACT" | "GROWTH">("LAW");
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSaveDraft = async () => {
        if (!draftPrinciple) return;
        try {
            const { saveTemplateAction, updateTemplateAction } = await import("@/app/actions");
            // StandardizeTags
            const tags = ["Master", "Consolidated"];

            if (editingId) {
                // UPDATE existing
                await updateTemplateAction(editingId, {
                    name: draftTitle || "Master Principle",
                    content: [draftPrinciple],
                    wisdomCategory: draftCategory
                });
                alert("Wisdom Updated!");
            } else {
                // CREATE new
                await saveTemplateAction(
                    "viral-wisdom",
                    draftTitle || "Master Principle",
                    [draftPrinciple], // Save as array of 1
                    undefined,
                    tags,
                    5,
                    draftCategory
                );
                alert("Master Principle Saved to Pool!");
            }

            setDraftPrinciple(null);
            setEditingId(null);
            setSelectedIds([]);
            loadWisdom();
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        }
    };

    const handleExportDocx = async () => {
        if (selectedIds.length === 0) return;
        setExportingDocx(true);
        try {
            const { generateWisdomDocx } = await import("@/lib/docx-exporter");
            const { saveAs } = await import("file-saver");

            const selectedTemplates = wisdoms.filter(w => selectedIds.includes(w.id));
            const blob = await generateWisdomDocx(selectedTemplates, "Wisdom Collection Export");
            const date = new Date().toISOString().slice(0, 10);
            saveAs(blob, `NeuroCode_Wisdom_${date}.docx`);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed");
        } finally {
            setExportingDocx(false);
        }
    };

    const handleEdit = () => {
        if (selectedIds.length !== 1) return;
        const target = wisdoms.find(w => w.id === selectedIds[0]);
        if (!target) return;

        // Ensure we have content to edit
        let contentToEdit: any = target.content;
        if (Array.isArray(target.content) && target.content.length > 0) {
            contentToEdit = target.content[0];
        } else if (typeof target.content === 'object' && target.content !== null) {
            contentToEdit = target.content;
        } else if (typeof target.content === 'string') {
            contentToEdit = {
                principle: target.content,
                explanation: "",
                universalLaw: "",
                actionableTip: ""
            };
        } else {
            // Fallback for empty/legacy
            contentToEdit = { principle: "", explanation: "", universalLaw: "", actionableTip: "" };
        }

        setDraftPrinciple(contentToEdit);
        setDraftCategory(target.wisdomCategory || "LAW");
        setDraftTitle(target.name.replace("Wisdom: ", "").replace("Master Principle: ", "").replace("👑 ", ""));
        setEditingId(target.id);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="p-6 border-b border-border/40 flex justify-between items-center bg-card/30 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h1 className={cn("text-2xl font-extrabold tracking-tight flex items-center gap-2 transition-colors",
                        filterMode === "LAW" ? "text-yellow-400" :
                            filterMode === "GROWTH" ? "text-red-500" :
                                filterMode === "FACT" ? "text-green-500" :
                                    "text-purple-500"
                    )}>
                        <GraduationCap className="w-6 h-6" />
                        WISDOM HUB
                    </h1>
                    <p className="text-sm text-muted-foreground">The Alchemist's Lab for Viral Knowledge.</p>
                </div>
                {/* Action Bar */}
                <div className="flex gap-2">
                    {selectedIds.length > 0 && !draftPrinciple && (
                        <>
                            {filterMode === "ARCHIVED" ? (
                                <button onClick={() => handleBatchArchive(false)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
                                    <Archive className="w-4 h-4" /> Restore
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center bg-muted/20 rounded-lg p-1 mr-2 border border-border/30">
                                        <span className="text-[10px] font-bold text-muted-foreground mx-2 uppercase">Move To:</span>
                                        <button onClick={() => handleBatchMove("LAW")} className="p-1.5 hover:bg-purple-500 hover:text-white rounded" title="Move to AXIOMS (Laws)">
                                            <GraduationCap className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleBatchMove("GROWTH")} className="p-1.5 hover:bg-yellow-500 hover:text-black rounded" title="Move to CREATOR GROWTH">
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleBatchMove("FACT")} className="p-1.5 hover:bg-green-500 hover:text-white rounded" title="Move to TOPIC RESEARCH">
                                            <BookOpen className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button onClick={() => handleBatchArchive(true)} className="bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold animate-in fade-in" title="Archive">
                                        <Archive className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold animate-in fade-in" title="Delete Permanently">
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {selectedIds.length > 1 && (
                                <div className="w-px h-6 bg-border/40 mx-2" />
                            )}
                        </>
                    )}

                    {selectedIds.length === 1 && !draftPrinciple && filterMode !== "ARCHIVED" && (
                        <button
                            onClick={handleEdit}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-2 rounded-lg shadow-lg animate-in fade-in flex items-center gap-2 text-xs"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                    )}

                    {selectedIds.length > 1 && !draftPrinciple && filterMode !== "ARCHIVED" && (
                        <button
                            onClick={handlePreviewConsolidate}
                            disabled={consolidating}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-right flex items-center gap-2 text-xs"
                        >
                            {consolidating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Compare & Merge ({selectedIds.length})
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleExportDocx}
                            disabled={exportingDocx}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-right flex items-center gap-2 text-xs"
                            title="Export Selected to DOCX"
                        >
                            {exportingDocx ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FileDown className="w-4 h-4" />}
                            DOCX
                        </button>
                    )}
                </div>
            </header >

            <div className="flex-1 flex overflow-hidden">
                {/* --- LEFT PANEL: THE POOL --- */}
                <div className="w-1/2 p-6 overflow-y-auto border-r border-border/40 bg-muted/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Knowledge Pool ({wisdoms.length})</h2>
                        <div className="flex bg-background/50 rounded-lg p-1 gap-1">
                            {["ALL", "LAW", "GROWTH", "FACT", "ARCHIVED"].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setFilterMode(m as any)}
                                    className={cn(
                                        "px-2 py-1 text-xs font-bold rounded-md transition-all",
                                        filterMode === m
                                            ? m === "LAW" ? "bg-purple-500 text-white"
                                                : m === "GROWTH" ? "bg-yellow-500 text-black"
                                                    : m === "FACT" ? "bg-green-500 text-white"
                                                        : m === "ARCHIVED" ? "bg-muted text-muted-foreground"
                                                            : "bg-white text-black"
                                            : "text-muted-foreground hover:bg-white/10"
                                    )}
                                >
                                    {m === "ALL" ? "All" : m === "LAW" ? "AXIOMS" : m === "GROWTH" ? "CREATOR GROWTH" : m === "FACT" ? "TOPIC RESEARCH" : "Archive"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="text-center py-20 animate-pulse text-muted-foreground">Scanning archives...</div>
                        ) : wisdoms.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-xl">
                                <Lightbulb className="w-10 h-10 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-lg font-bold mb-2">The Pool is Empty</h3>
                                <p className="text-muted-foreground text-sm">
                                    Go to the <a href="/scanner" className="text-purple-500 hover:underline">Scanner</a> and use "Meta-Analysis" to extract wisdom from videos.
                                </p>
                            </div>
                        ) : wisdoms
                            .filter(w => {
                                const isArchived = w.tags?.includes("Archived");

                                if (filterMode === "ARCHIVED") return isArchived;
                                if (isArchived) return false; // Hide archived from other tabs

                                if (filterMode === "ALL") return true;

                                // Use new top-level category or fallback for legacy
                                const type = w.wisdomCategory || "LAW";
                                return type === filterMode;
                            })
                            .map((w) => {
                                const isSelected = selectedIds.includes(w.id);
                                return (
                                    <div
                                        key={w.id}
                                        onClick={() => toggleSelection(w.id)}
                                        className={`bg-card border p-4 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${isSelected ? "border-yellow-500 ring-1 ring-yellow-500 bg-yellow-500/5" : "border-border/50"}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex flex-col pr-4">
                                                <h3 className="font-bold text-sm leading-tight text-foreground/90">
                                                    {w.name.replace("Wisdom: ", "").replace("Master Principle: ", "👑 ")}
                                                </h3>
                                                {w.createdAt && (
                                                    <span className="text-[10px] font-mono text-muted-foreground mt-1">
                                                        {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewingNugget(w); }}
                                                    className="p-1 text-muted-foreground hover:text-blue-500 transition-colors"
                                                    title="View Full Content"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="accent-yellow-500 w-4 h-4"
                                                />
                                            </div>
                                        </div>

                                        {/* Universal Law Preview */}
                                        {Array.isArray(w.content) && w.content[0]?.universalLaw && (
                                            <div className="text-[10px] font-mono text-blue-400 mb-2 truncate">
                                                ⚖️ {w.content[0].universalLaw}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${w.tags?.includes("Master") ? "bg-purple-500/20 text-purple-400" : "bg-muted text-muted-foreground"}`}>
                                                {w.tags?.includes("Master") ? "Master" : "Nugget"}
                                            </span>

                                            {/* Type Badge */}
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                                (w.wisdomCategory || "LAW") === "LAW" ? "bg-purple-500/20 text-purple-400" :
                                                    w.wisdomCategory === "GROWTH" ? "bg-yellow-500/20 text-yellow-500" :
                                                        w.wisdomCategory === "FACT" ? "bg-green-500/20 text-green-500" :
                                                            "bg-muted text-muted-foreground"
                                            )}>
                                                {w.wisdomCategory || "LAW"}
                                            </span>

                                            {w.rating && <span className="text-[10px] text-yellow-500 font-bold">★{w.rating}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* --- RIGHT PANEL: THE CANVAS --- */}
                <div className="w-1/2 p-8 overflow-y-auto bg-background/50 relative">
                    <div className="max-w-xl mx-auto">
                        {!draftPrinciple ? (
                            <div className="text-center py-20 opacity-50">
                                <Edit className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-bold mb-2">Workbench Empty</h3>
                                <p className="text-sm text-muted-foreground">Select multiple nuggets from the pool and click "Merge" to synthesize a Master Principle.</p>
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-bottom-5 fade-in space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" /> Synthesis Draft
                                    </h2>
                                    <button onClick={() => { setDraftPrinciple(null); setEditingId(null); }} className="text-muted-foreground hover:text-white text-xs">Discard</button>
                                </div>

                                <div className="space-y-4 bg-card border border-yellow-500/30 p-6 rounded-xl shadow-2xl">

                                    {/* TITLE INPUT */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                                        <input
                                            value={draftTitle}
                                            onChange={(e) => setDraftTitle(e.target.value)}
                                            className="w-full bg-muted/30 border border-border rounded px-3 py-2 font-bold text-lg focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>

                                    {/* UNIVERSAL LAW EDITOR */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Universal Law (English DNA)
                                        </label>
                                        <input
                                            value={draftPrinciple.universalLaw || ""}
                                            onChange={(e) => setDraftPrinciple({ ...draftPrinciple, universalLaw: e.target.value })}
                                            className="w-full bg-blue-500/5 border border-blue-500/30 text-blue-200 font-mono text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                            placeholder="The Law of..."
                                        />
                                        <p className="text-[10px] text-muted-foreground">This is the logic the Architect will use.</p>
                                    </div>

                                    <hr className="border-border/30" />

                                    {/* PRINCIPLE EDITOR */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Core Principle</label>
                                        <textarea
                                            value={draftPrinciple.principle || ""}
                                            onChange={(e) => setDraftPrinciple({ ...draftPrinciple, principle: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 min-h-[60px]"
                                        />
                                    </div>

                                    {/* EXPLANATION EDITOR */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Deep Explanation</label>
                                        <textarea
                                            value={draftPrinciple.explanation || ""}
                                            onChange={(e) => setDraftPrinciple({ ...draftPrinciple, explanation: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:border-yellow-500 min-h-[100px]"
                                        />
                                    </div>

                                    {/* TIP EDITOR */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-green-500">Actionable Tip</label>
                                        <input
                                            value={draftPrinciple.actionableTip || ""}
                                            onChange={(e) => setDraftPrinciple({ ...draftPrinciple, actionableTip: e.target.value })}
                                            className="w-full bg-green-500/5 border border-green-500/30 text-green-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-green-500"
                                        />
                                    </div>

                                    {/* CATEGORY SELECTOR */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                                        <div className="flex gap-2">
                                            {(["LAW", "GROWTH", "FACT"] as const).map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setDraftCategory(cat)}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                                                        draftCategory === cat
                                                            ? cat === "LAW" ? "bg-purple-500 text-white border-purple-500"
                                                                : cat === "GROWTH" ? "bg-yellow-500 text-black border-yellow-500"
                                                                    : "bg-green-500 text-white border-green-500"
                                                            : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                                                    )}
                                                >
                                                    {cat === "LAW" ? "AXIOM (Law)" : cat === "GROWTH" ? "GROWTH (Meta)" : "RESEARCH (Fact)"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveDraft}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg shadow-lg transition-all mt-4"
                                    >
                                        {viewingNugget ? "Save Changes (Update)" : "Save to Universal Pool"}
                                    </button>

                                </div>
                            </div>

                        )}
                    </div>
                </div>
            </div>
            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={`Delete ${selectedIds.length} Nugget${selectedIds.length === 1 ? '' : 's'}?`}
                description="This action cannot be undone. These items will be permanently removed from your wisdom pool."
                confirmText="Delete Permanently"
                onConfirm={executeBatchDelete}
                variant="destructive"
            />

            {/* View Modal */}
            <Dialog open={!!viewingNugget} onOpenChange={(open) => !open && setViewingNugget(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-xl">
                                {viewingNugget?.name.replace("Wisdom: ", "").replace("Master Principle: ", "👑 ")}
                            </span>
                            {viewingNugget?.wisdomCategory && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded font-bold uppercase",
                                    viewingNugget.wisdomCategory === "LAW" ? "bg-purple-500/20 text-purple-400" :
                                        viewingNugget.wisdomCategory === "GROWTH" ? "bg-yellow-500/20 text-yellow-500" :
                                            viewingNugget.wisdomCategory === "FACT" ? "bg-green-500/20 text-green-500" : "bg-muted"
                                )}>
                                    {viewingNugget.wisdomCategory}
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Full content view
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {viewingNugget && (() => {
                            const c = viewingNugget.content;

                            // 1. String Content (Markdown/Text)
                            if (typeof c === 'string') {
                                return (
                                    <div className="whitespace-pre-wrap font-mono text-sm bg-muted/30 p-4 rounded-lg border border-border/50">
                                        {c}
                                    </div>
                                );
                            }

                            // 2. Standard Nugget Object (or Array of 1)
                            let nugget = c;
                            if (Array.isArray(c) && c.length > 0) nugget = c[0];

                            if (typeof nugget === 'object' && nugget !== null) {
                                // Check if it looks like our standard schema
                                if (nugget.universalLaw || nugget.principle || nugget.explanation) {
                                    return (
                                        <div className="space-y-6">
                                            {nugget.universalLaw && (
                                                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                                    <h4 className="text-blue-400 font-bold uppercase text-xs mb-1 flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3" /> Universal Law
                                                    </h4>
                                                    <p className="font-mono text-blue-200">{nugget.universalLaw}</p>
                                                </div>
                                            )}

                                            {nugget.principle && (
                                                <div>
                                                    <h4 className="font-bold text-yellow-500 text-sm mb-2">Core Principle</h4>
                                                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                        {nugget.principle}
                                                    </div>
                                                </div>
                                            )}

                                            {nugget.explanation && (
                                                <div>
                                                    <h4 className="font-bold text-muted-foreground text-sm mb-2">Deep Explanation</h4>
                                                    <div className="bg-muted/30 p-4 rounded-lg border border-border whitespace-pre-wrap">
                                                        {nugget.explanation}
                                                    </div>
                                                </div>
                                            )}

                                            {nugget.actionableTip && (
                                                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                                                    <h4 className="text-green-400 font-bold uppercase text-xs mb-1">🚀 Actionable Tip</h4>
                                                    <p className="text-green-300">{nugget.actionableTip}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            }

                            // 3. Fallback: JSON Dump
                            return (
                                <pre className="whitespace-pre-wrap font-mono text-xs bg-black/50 p-4 rounded-lg overflow-x-auto text-green-400">
                                    {JSON.stringify(c, null, 2)}
                                </pre>
                            );

                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
