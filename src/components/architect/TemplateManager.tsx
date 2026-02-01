"use client";

import { useState } from "react";
import { Template } from "@/lib/templates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FolderOpen, Pencil, Trash2, Check, X, Loader2, FileText, Sparkles, Clapperboard, Copy } from "lucide-react";
import { deleteTemplateAction, updateTemplateAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TemplateManagerProps {
    isOpen: boolean;
    onClose: () => void;
    templates: Template[];
    onLoad: (template: Template) => void;
    onRefresh: () => void; // Refresh list parent
}

export function TemplateManager({ isOpen, onClose, templates, onLoad, onRefresh }: TemplateManagerProps) {
    const [activeTab, setActiveTab] = useState<"drafts" | "blueprints" | "prompts" | "necessities">("drafts");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [status, setStatus] = useState<"idle" | "active">("idle");

    const handleEditStart = (t: Template) => {
        setEditingId(t.id);
        setEditName(t.name);
    };

    const handleEditSave = async (id: string) => {
        if (!editName.trim()) return;
        setStatus("active");
        await updateTemplateAction(id, { name: editName });
        setEditingId(null);
        setStatus("idle");
        onRefresh();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        setStatus("active");
        await deleteTemplateAction(id);
        setStatus("idle");
        onRefresh();
    };

    // SORTING: Newest first & Filter Invalid
    const sortedTemplates = templates
        .filter(t => t && t.name && t.type) // Defensive check
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter logic
    const blueprints = sortedTemplates.filter(t => t.type === "viral-wisdom" || t.name.includes("🧬"));
    const prompts = sortedTemplates.filter(t => ["prompt", "visual", "audio"].includes(t.type));
    const necessities = sortedTemplates.filter(t => t.type === "necessity");
    // Drafts are scripts that are NOT blueprints
    const drafts = sortedTemplates.filter(t => t.type === "script" && !t.name.includes("🧬") && !blueprints.includes(t) && !necessities.includes(t));

    const getActiveList = () => {
        switch (activeTab) {
            case "blueprints": return blueprints;
            case "prompts": return prompts;
            case "necessities": return necessities;
            default: return drafts;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="p-6 pb-0 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FolderOpen className="w-6 h-6 text-primary" /> Template Library
                        </DialogTitle>
                    </div>

                    {/* TABS HEADER */}
                    <div className="flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-border/50 w-fit">
                        <button
                            onClick={() => setActiveTab("drafts")}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === "drafts"
                                    ? "bg-white text-black shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <FileText className="w-4 h-4" /> Script Drafts
                            <span className="bg-black/10 text-xs px-1.5 rounded-full">{drafts.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("blueprints")}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === "blueprints"
                                    ? "bg-purple-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
                            )}
                        >
                            <Sparkles className="w-4 h-4" /> Strategy Blueprints
                            <span className="bg-purple-500/20 text-xs px-1.5 rounded-full">{blueprints.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("prompts")}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === "prompts"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                            )}
                        >
                            <Clapperboard className="w-4 h-4" /> Saved Prompts
                            <span className="bg-amber-500/20 text-xs px-1.5 rounded-full">{prompts.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("necessities")}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === "necessities"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                            )}
                        >
                            <Sparkles className="w-4 h-4" /> Niki Examples
                            <span className="bg-emerald-500/20 text-xs px-1.5 rounded-full">{necessities.length}</span>
                        </button>
                    </div>

                    <DialogDescription className="mt-2 text-xs">
                        {activeTab === "drafts" && "Manage your written scripts and works in progress."}
                        {activeTab === "blueprints" && "Re-usable strategic frameworks and viral patterns."}
                        {activeTab === "prompts" && "Exportable assets: Video Prompts, Audio Direction, and Visual Concepts."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    <div className="space-y-2">
                        {getActiveList().length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-50 border-2 border-dashed border-border rounded-xl">
                                <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                                <p>No {activeTab} found.</p>
                            </div>
                        ) : (
                            getActiveList().map(t => (
                                <TemplateRow
                                    key={t.id}
                                    template={t}
                                    editingId={editingId}
                                    editName={editName}
                                    onEditStart={handleEditStart}
                                    onEditChange={setEditName}
                                    onEditSave={handleEditSave}
                                    onEditCancel={() => setEditingId(null)}
                                    onDelete={handleDelete}
                                    onLoad={onLoad}
                                    isLoading={status === "active"}
                                    isBlueprint={activeTab === "blueprints"}
                                    isPrompt={activeTab === "prompts"}
                                    isNecessity={activeTab === "necessities"}
                                />
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}

function TemplateRow({ template, editingId, editName, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete, onLoad, isLoading, isBlueprint, isPrompt, isNecessity }: any) {
    const isEditing = editingId === template.id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("flex items-center justify-between p-3 rounded-lg border transition-all group",
                isBlueprint ? "bg-purple-900/10 border-purple-500/20 hover:bg-purple-900/20" :
                    isPrompt ? "bg-amber-900/10 border-amber-500/20 hover:bg-amber-900/20" :
                        isNecessity ? "bg-emerald-900/10 border-emerald-500/20 hover:bg-emerald-900/20" :
                            "bg-card border-border/40 hover:bg-muted/50")}
        >
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0",
                    isBlueprint ? "bg-purple-500/20 text-purple-400" :
                        isPrompt ? "bg-amber-500/20 text-amber-500" :
                            isNecessity ? "bg-emerald-500/20 text-emerald-500" :
                                "bg-primary/20 text-primary")}>
                    {isBlueprint ? <Sparkles className="w-4 h-4" /> : isPrompt ? <Clapperboard className="w-4 h-4" /> : isNecessity ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            value={editName}
                            onChange={(e) => onEditChange(e.target.value)}
                            className="bg-background border border-primary/50 rounded px-2 py-1 text-sm w-full outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        <button onClick={() => onEditSave(template.id)} disabled={isLoading} className="p-1 hover:bg-green-500/20 text-green-500 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={onEditCancel} disabled={isLoading} className="p-1 hover:bg-red-500/20 text-red-500 rounded"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate text-sm">{template.name.replace('🧬 ', '')}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 ml-4">
                {!isEditing && (
                    <>
                        <button
                            onClick={() => onLoad(template)}
                            className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            Load
                        </button>
                        {isPrompt && (
                            <button
                                onClick={() => {
                                    const text = isPrompt && Array.isArray(template.content)
                                        ? template.content.map((p: any) => `[SCENE ${p.sceneId}] ${p.visualFocus}\nPrompt: ${p.prompt}`).join("\n\n")
                                        : JSON.stringify(template.content, null, 2);
                                    navigator.clipboard.writeText(text);
                                    alert("Prompts copied to clipboard!");
                                }}
                                className="px-3 py-1.5 text-xs font-bold bg-muted text-foreground border border-border rounded hover:bg-muted/80 transition-colors ml-2"
                                title="Copy all prompts"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        )}
                        <div className="w-[1px] h-4 bg-border/50 mx-1" />
                        <button onClick={() => onEditStart(template)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Rename">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(template.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    )
}
