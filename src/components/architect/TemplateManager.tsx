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

    // Filter blueprints vs drafts vs prompts
    const blueprints = templates.filter(t => t.type === "viral-wisdom" || t.name.includes("🧬"));
    const prompts = templates.filter(t => t.type === "prompt");
    const drafts = templates.filter(t => !blueprints.includes(t) && !prompts.includes(t));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="p-6 border-b border-border/40 bg-muted/20">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" /> Template Library
                    </DialogTitle>
                    <DialogDescription>
                        Manage your Saved Drafts and Strategy Blueprints.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* DRAFTS SECTION */}
                    <section>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Script Drafts
                        </h3>
                        {drafts.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No drafts saved yet. Save from the Script Architect.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {drafts.map(t => (
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
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* BLUEPRINTS SECTION */}
                    <section>
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Strategy Blueprints
                        </h3>
                        {blueprints.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No blueprints saved yet. Create one in the Strategy Forge.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {blueprints.map(t => (
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
                                        isBlueprint
                                    />
                                ))}
                            </div>
                        )}
                    </section>


                    {/* PROMPTS SECTION */}
                    <section>
                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clapperboard className="w-4 h-4" /> Saved Video Prompts
                        </h3>
                        {prompts.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No prompts saved yet. Generate and save them in Director Mode.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {prompts.map(t => (
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
                                        isPrompt
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog >
    );
}

function TemplateRow({ template, editingId, editName, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete, onLoad, isLoading, isBlueprint, isPrompt }: any) {
    const isEditing = editingId === template.id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("flex items-center justify-between p-3 rounded-lg border transition-all group",
                isBlueprint ? "bg-purple-900/10 border-purple-500/20 hover:bg-purple-900/20" :
                    isPrompt ? "bg-amber-900/10 border-amber-500/20 hover:bg-amber-900/20" :
                        "bg-card border-border/40 hover:bg-muted/50")}
        >
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0",
                    isBlueprint ? "bg-purple-500/20 text-purple-400" :
                        isPrompt ? "bg-amber-500/20 text-amber-500" :
                            "bg-primary/20 text-primary")}>
                    {isBlueprint ? <Sparkles className="w-4 h-4" /> : isPrompt ? <Clapperboard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
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
