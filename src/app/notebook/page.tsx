"use client";

import { useState, useEffect } from "react";
import {
    Notebook,
    Lightbulb,
    ListTodo,
    Plus,
    Archive,
    CheckCircle2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    MoreVertical,
    AlertCircle,
    Tag,
    X,
    Palette,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    NotebookItem,
    TOPIC_STATUSES,
    STEP_STATUSES,
    NotebookItemType
} from "@/lib/notebook-types";
import { TAG_COLORS } from "@/lib/notebook-config-types";
import {
    getNotebookItemsAction,
    createNotebookItemAction,
    updateNotebookItemAction,
    deleteNotebookItemAction,
    getNotebookConfigAction,
    updateTagColorAction,
    startGenesisAction,
    renameTagAction
} from "@/app/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function NotebookPage() {
    const [items, setItems] = useState<NotebookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tagColors, setTagColors] = useState<Record<string, string>>({});

    const [activeTab, setActiveTab] = useState<NotebookItemType>("topic");
    const [viewMode, setViewMode] = useState<"active" | "archived">("active");

    // Modal States
    const [isCreating, setIsCreating] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemDescription, setNewItemDescription] = useState("");
    const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">("medium");
    const [newItemTags, setNewItemTags] = useState<string[]>([]);
    const [newItemTagInput, setNewItemTagInput] = useState("");


    const [editingItem, setEditingItem] = useState<NotebookItem | null>(null);
    const [editItemTags, setEditItemTags] = useState<string[]>([]);
    const [editItemTagInput, setEditItemTagInput] = useState("");
    const [activeColorPickerTag, setActiveColorPickerTag] = useState<string | null>(null); // Tag currently being colored
    const [editingTagName, setEditingTagName] = useState<string | null>(null); // Tag currently being renamed
    const [editingTagValue, setEditingTagValue] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<NotebookItem | null>(null);
    const [showTagManager, setShowTagManager] = useState(false);


    useEffect(() => {
        loadItems();
        loadConfig();
    }, []);

    // Sync tags for editing
    useEffect(() => {
        if (editingItem) {
            setEditItemTags(editingItem.tags || []);
        } else {
            setEditItemTags([]);
        }
    }, [editingItem]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await getNotebookItemsAction();
            setItems(data);
        } catch (e) {
            console.error("Failed to load notebook items", e);
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async () => {
        try {
            const config = await getNotebookConfigAction();
            setTagColors(config.tagColors || {});
        } catch (e) {
            console.error("Failed to load notebook config", e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;

        await createNotebookItemAction(
            activeTab,
            newItemTitle,
            newItemDescription,
            newItemPriority,
            newItemTags
        );

        setNewItemTitle("");
        setNewItemDescription("");
        setNewItemPriority("medium");
        setNewItemTags([]);
        setIsCreating(false);
        await loadItems();
    };

    const handleAddTag = (e: React.KeyboardEvent, isEdit = false) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = isEdit ? editItemTagInput : newItemTagInput;
            if (val.trim()) {
                if (isEdit) {
                    if (!editItemTags.includes(val.trim())) setEditItemTags([...editItemTags, val.trim()]);
                    setEditItemTagInput("");
                } else {
                    if (!newItemTags.includes(val.trim())) setNewItemTags([...newItemTags, val.trim()]);
                    setNewItemTagInput("");
                }
            }
        }
    };

    const removeTag = (tag: string, isEdit = false) => {
        if (isEdit) {
            setEditItemTags(editItemTags.filter(t => t !== tag));
        } else {
            setNewItemTags(newItemTags.filter(t => t !== tag));
        }
    };

    const updateColor = async (tag: string, color: string) => {
        const newConfig = await updateTagColorAction(tag, color);
        setTagColors(newConfig.tagColors);
        setActiveColorPickerTag(null);
    };

    const handleRenameTag = async (oldName: string) => {
        if (!editingTagValue.trim() || editingTagValue.trim() === oldName) {
            setEditingTagName(null);
            return;
        }
        await renameTagAction(oldName, editingTagValue.trim());
        setEditingTagName(null);
        await loadItems();
        await loadConfig();
    };



    const handleUpdateStatus = async (item: NotebookItem, direction: "prev" | "next") => {
        const statuses: readonly string[] = item.type === "topic" ? TOPIC_STATUSES : STEP_STATUSES;
        const currentIndex = statuses.indexOf(item.status);

        let newIndex = currentIndex;
        if (direction === "next") newIndex = Math.min(currentIndex + 1, statuses.length - 1);
        if (direction === "prev") newIndex = Math.max(currentIndex - 1, 0);

        if (newIndex !== currentIndex) {
            const newStatus = statuses[newIndex];
            await updateNotebookItemAction(item.id, { status: newStatus });
            // Optimistic update
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));

            // GENESIS TRIGGER
            if (
                (item.type === "topic" && newStatus === "Scripting") ||
                (item.type === "step" && newStatus === "In Progress")
            ) {
                // Determine trigger name
                const triggerName = item.type === "topic" ? "Scripting Protocol" : "Production Protocol";

                // Show immediate feedback (Mock Toast)
                const toast = document.createElement("div");
                toast.className = "fixed bottom-4 right-4 bg-cyan-950 text-cyan-400 border border-cyan-500/50 px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-right duration-300";
                toast.innerHTML = `
                    <div class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </div>
                    <div>
                        <div class="font-bold text-sm">GENESIS ENGINE STARTED</div>
                        <div class="text-xs text-cyan-400/70">Initializing ${triggerName}...</div>
                    </div>
                `;
                document.body.appendChild(toast);

                // Remove toast after 5s
                setTimeout(() => toast.remove(), 5000);

                // Execute Genesis
                startGenesisAction(item).then(result => {
                    if (result.success) {
                        toast.innerHTML = `
                            <div class="text-green-400">
                                <div class="font-bold text-sm">BLUEPRINT GENERATED</div>
                                <div class="text-xs text-green-400/70">Saved to Desktop / NeuroCode_Teasers</div>
                            </div>
                        `;
                        // Re-add to ensure user sees success if they missed start
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 5000);
                    } else {
                        console.error("Genesis Failed", result.error);
                    }
                });
            }
        }
    };

    const handleUpdate = async (id: string, updates: Partial<NotebookItem>) => {
        // Include updated tags
        const finalUpdates = { ...updates, tags: editItemTags };

        await updateNotebookItemAction(id, finalUpdates);
        setEditingItem(null);
        await loadItems();
    };

    const handleArchive = async (item: NotebookItem) => {
        await updateNotebookItemAction(item.id, { isArchived: !item.isArchived });
        await loadItems();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteNotebookItemAction(deleteId);
        setDeleteId(null);
        setItemToDelete(null);
        await loadItems();
    };

    const filteredItems = items.filter(item => {
        return item.type === activeTab &&
            (viewMode === "active" ? !item.isArchived : item.isArchived);
    });

    const statuses = activeTab === "topic" ? TOPIC_STATUSES : STEP_STATUSES;
    const allTags = Array.from(new Set(items.flatMap(i => i.tags || []))).sort();

    const getTagStyle = (tag: string) => {
        const color = tagColors[tag];
        if (color) {
            return { backgroundColor: color + "20", color: color, borderColor: color + "40" };
        }
        return {}; // Default style provided by CSS classes
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Notebook className="w-8 h-8 text-primary" />
                        Notebook
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Manage your Content Pipeline and Development Steps.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab("topic")}
                            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "topic" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                        >
                            <Lightbulb className="w-4 h-4" />
                            TOPICS
                        </button>
                        <button
                            onClick={() => setActiveTab("step")}
                            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "step" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                        >
                            <ListTodo className="w-4 h-4" />
                            STEPS
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("active")}
                        className={cn("text-sm font-medium px-3 py-1 rounded transition-colors", viewMode === "active" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        Active Board
                    </button>
                    <button
                        onClick={() => setViewMode("archived")}
                        className={cn("text-sm font-medium px-3 py-1 rounded transition-colors", viewMode === "archived" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        Archive
                    </button>
                </div>

                <button
                    onClick={() => setShowTagManager(true)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors mr-2"
                    title="Tag Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> New {activeTab === "topic" ? "Topic" : "Step"}
                </button>
            </div>

            {/* Creating Interface */}
            {isCreating && (
                <div className="bg-muted/30 border border-border/50 p-4 rounded-xl animate-in slide-in-from-top-2">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                placeholder={`Enter ${activeTab} title...`}
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                            />
                            <select
                                value={newItemPriority}
                                onChange={(e) => setNewItemPriority(e.target.value as any)}
                                className="bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <textarea
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="Add details (optional)..."
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                        />

                        {/* Tag Input */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {newItemTags.map(tag => (
                                    <span
                                        key={tag}
                                        style={getTagStyle(tag)}
                                        className={cn("bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-transparent", !tagColors[tag] && "bg-primary/10 text-primary")}
                                    >
                                        # {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={newItemTagInput}
                                    onChange={(e) => setNewItemTagInput(e.target.value)}
                                    onKeyDown={(e) => handleAddTag(e, false)}
                                    placeholder="Add tags (press Enter)..."
                                    className="bg-transparent border-none focus:outline-none text-sm w-full"
                                />
                            </div>
                            {/* Tag Suggestions */}
                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border/30">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground self-center mr-1">Suggestions:</span>
                                    {allTags.filter(t => !newItemTags.includes(t)).map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setNewItemTags([...newItemTags, tag])}
                                            style={getTagStyle(tag)}
                                            className={cn("bg-muted hover:bg-muted/80 px-2 py-1 rounded text-[10px] text-muted-foreground transition-colors border border-transparent", !tagColors[tag] && "text-muted-foreground")}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>


                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold">Create Item</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {statuses.map((status) => {
                        const columnItems = filteredItems.filter(i => i.status === status);
                        return (
                            <div key={status} className="w-80 flex flex-col bg-muted/20 border border-border/50 rounded-xl h-full">
                                {/* Column Header */}
                                <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-muted/20 backdrop-blur-sm rounded-t-xl z-10">
                                    <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">{status}</h3>
                                    <span className="bg-muted text-xs font-bold px-2 py-0.5 rounded-full text-muted-foreground">
                                        {columnItems.length}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {columnItems.map(item => (
                                        <div key={item.id} className="bg-card border border-border/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow group relative">
                                            {/* Priority Stripe */}
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                                                item.priority === "high" ? "bg-red-500" :
                                                    item.priority === "medium" ? "bg-yellow-500" :
                                                        "bg-blue-500"
                                            )} />

                                            <div className="ml-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Tags Display */}
                                                {item.tags && item.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {item.tags.map(tag => (
                                                            <span
                                                                key={tag}
                                                                style={getTagStyle(tag)}
                                                                className={cn("bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-medium border border-transparent", !tagColors[tag] && "bg-muted text-muted-foreground")}
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {item.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                                    <div className="flex items-center gap-2">
                                                        {   /* Move Left */
                                                            item.status !== statuses[0] && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(item, "prev")}
                                                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                                    title="Move Back"
                                                                >
                                                                    <ChevronLeft className="w-4 h-4" />
                                                                </button>
                                                            )
                                                        }
                                                    </div>

                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                        {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        {   /* Move Right */
                                                            item.status !== statuses[statuses.length - 1] && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(item, "next")}
                                                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                                    title="Advance"
                                                                >
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg p-6 rounded-xl border border-border shadow-2xl space-y-4 relative">
                        <button
                            onClick={() => setEditingItem(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-primary" />
                            Edit {editingItem.type === 'topic' ? 'Topic' : 'Step'}
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Title</label>
                                <input
                                    type="text"
                                    defaultValue={editingItem.title}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                                    id="edit-title"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Description</label>
                                <textarea
                                    defaultValue={editingItem.description}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                                    id="edit-desc"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-md">
                                    {editItemTags.length === 0 && <span className="text-xs text-muted-foreground italic">No tags</span>}
                                    {editItemTags.map(tag => (
                                        <div key={tag} className="relative group/tag">
                                            <span
                                                style={getTagStyle(tag)}
                                                className={cn("bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-transparent cursor-pointer hover:ring-2 ring-primary/30", !tagColors[tag] && "bg-primary/20 text-primary")}
                                                onClick={() => setActiveColorPickerTag(activeColorPickerTag === tag ? null : tag)}
                                            >
                                                # {tag}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag, true); }} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                                            </span>

                                            {/* Color Picker Popover */}
                                            {activeColorPickerTag === tag && (
                                                <div className="absolute top-full left-0 mt-2 p-2 bg-card border border-border rounded-lg shadow-xl z-50 flex gap-1 grid grid-cols-5 w-40">
                                                    {TAG_COLORS.map(c => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => updateColor(tag, c.value)}
                                                            className="w-6 h-6 rounded-full hover:scale-110 transition-transform border border-border/20"
                                                            style={{ backgroundColor: c.value }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                    <button
                                                        onClick={() => updateColor(tag, "")} // Reset
                                                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border border-border/20 hover:scale-110 transition-transform"
                                                        title="Default"
                                                    >
                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={editItemTagInput}
                                        onChange={(e) => setEditItemTagInput(e.target.value)}
                                        onKeyDown={(e) => handleAddTag(e, true)}
                                        placeholder="Add tag (press Enter)..."
                                        className="bg-transparent border-b border-border focus:border-primary focus:outline-none text-sm w-full py-1"
                                    />
                                </div>
                                {/* Tag Suggestions in Edit */}
                                {allTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/30">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground self-center mr-1">All Tags:</span>
                                        {allTags.filter(t => !editItemTags.includes(t)).map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setEditItemTags([...editItemTags, tag])}
                                                style={getTagStyle(tag)}
                                                className={cn("bg-muted hover:bg-muted/80 px-2 py-1 rounded text-[10px] text-muted-foreground transition-colors border border-transparent", !tagColors[tag] && "bg-muted text-muted-foreground")}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Status</label>
                                    <select
                                        defaultValue={editingItem.status}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2"
                                        id="edit-status"
                                    >
                                        {(editingItem.type === 'topic' ? TOPIC_STATUSES : STEP_STATUSES).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Priority</label>
                                    <select
                                        defaultValue={editingItem.priority}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2"
                                        id="edit-priority"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setDeleteId(editingItem.id);
                                        setItemToDelete(editingItem);
                                        setEditingItem(null);
                                    }}
                                    className="text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                                <button
                                    onClick={() => {
                                        handleArchive(editingItem);
                                        setEditingItem(null);
                                    }}
                                    className="text-muted-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Archive className="w-4 h-4" /> {editingItem.isArchived ? "Unarchive" : "Archive"}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 hover:underline text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const title = (document.getElementById('edit-title') as HTMLInputElement).value;
                                        const desc = (document.getElementById('edit-desc') as HTMLTextAreaElement).value;
                                        const status = (document.getElementById('edit-status') as HTMLSelectElement).value;
                                        const priority = (document.getElementById('edit-priority') as HTMLSelectElement).value as any;
                                        handleUpdate(editingItem.id, { title, description: desc, status, priority });
                                    }}
                                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Item?"
                description={`This will permanently delete "${itemToDelete?.title}".`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />

            {/* Tag Manager Modal */}
            {showTagManager && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl space-y-4 relative max-h-[80vh] flex flex-col">
                        <button
                            onClick={() => setShowTagManager(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border/50 pb-4">
                            <Settings className="w-5 h-5 text-primary" />
                            Tag Manager
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {allTags.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No tags found in your notebook.</p>
                            ) : (
                                allTags.map(tag => (
                                    <div key={tag} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span
                                                className="w-4 h-4 rounded-full border border-white/10 shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: tagColors[tag] || 'transparent' }}
                                            />

                                            {editingTagName === tag ? (
                                                <input
                                                    type="text"
                                                    value={editingTagValue}
                                                    onChange={(e) => setEditingTagValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameTag(tag);
                                                        if (e.key === 'Escape') setEditingTagName(null);
                                                    }}
                                                    onBlur={() => handleRenameTag(tag)}
                                                    autoFocus
                                                    className="bg-background border border-primary rounded px-2 py-0.5 text-sm font-medium focus:outline-none w-full max-w-[150px]"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 group/name cursor-pointer" onClick={() => { setEditingTagName(tag); setEditingTagValue(tag); }}>
                                                    <span className="font-medium">#{tag}</span>
                                                    <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-1 relative group">
                                            <div className="flex gap-1">
                                                {TAG_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => updateColor(tag, c.value)}
                                                        className={cn(
                                                            "w-5 h-5 rounded-full border border-transparent hover:scale-110 transition-transform",
                                                            tagColors[tag] === c.value && "ring-2 ring-white ring-offset-1 ring-offset-background"
                                                        )}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.name}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => updateColor(tag, "")}
                                                    className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:scale-110 transition-transform"
                                                    title="Default"
                                                >
                                                    <X className="w-3 h-3 text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground text-center">
                            Changes are saved automatically and applied globally.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
