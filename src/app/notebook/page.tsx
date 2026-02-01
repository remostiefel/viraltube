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
    Settings,
    Copy,
    Check,
    ChevronUp,
    ChevronDown,
    BrainCircuit
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

    renameTagAction,
    reorderNotebookItemAction,
    saveNotebookOrderAction
} from "@/app/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IdeaSearchModule } from "@/components/notebook/IdeaSearchModule";

// Helper to Sort Column
const sortItemsByPriority = (items: NotebookItem[]) => {
    return [...items].sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 1;
        const weightB = priorityWeight[b.priority] || 1;

        if (weightA !== weightB) return weightB - weightA; // Higher priority first
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); // Newest first
    });
};

export default function NotebookPage() {
    const [items, setItems] = useState<NotebookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tagColors, setTagColors] = useState<Record<string, string>>({});

    const [activeTab, setActiveTab] = useState<NotebookItemType>("step");
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
    const [showTrendRadar, setShowTrendRadar] = useState(false);


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

        const newItem = await createNotebookItemAction(
            activeTab,
            newItemTitle,
            newItemDescription,
            newItemPriority,
            newItemTags
        );

        // Auto-Sort the new column (usually first status)
        const temp = [newItem, ...items];
        // Identify target column (first status)
        const firstStatus = activeTab === 'topic' ? TOPIC_STATUSES[0] : STEP_STATUSES[0];
        const colItems = temp.filter(i => i.status === firstStatus && i.type === activeTab);
        const otherItems = temp.filter(i => !(i.status === firstStatus && i.type === activeTab));
        const sortedCol = sortItemsByPriority(colItems);
        const final = [...sortedCol, ...otherItems];

        // Set state
        setItems(final);
        // Save the new order
        saveNotebookOrderAction(final);

        setNewItemTitle("");
        setNewItemDescription("");
        setNewItemPriority("medium");
        setNewItemTags([]);
        setIsCreating(false);
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
    };

    const handleCopy = (item: NotebookItem) => {
        const textToCopy = `${item.title}\n\n${item.description || ""}`;
        navigator.clipboard.writeText(textToCopy);

        // Indicate success briefly via button state if we had local state per item,
        // or just a toast. Using a simple toast here for consistency with other actions.
        const toast = document.createElement("div");
        toast.className = "fixed bottom-4 right-4 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg z-[100] flex items-center gap-2 animate-in slide-in-from-right fade-in duration-300";
        toast.innerHTML = `
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span class="font-bold text-sm">Copied to Clipboard</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const handleReorder = async (item: NotebookItem, direction: "up" | "down", e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault(); // Stop scrolling
            e.stopPropagation();
        }

        const index = items.findIndex(i => i.id === item.id);
        if (index === -1) return;

        let targetIndex = -1;

        if (direction === "up") {
            for (let i = index - 1; i >= 0; i--) {
                if (
                    items[i].status === item.status &&
                    items[i].type === item.type &&
                    items[i].isArchived === item.isArchived
                ) {
                    targetIndex = i;
                    break;
                }
            }
        } else {
            for (let i = index + 1; i < items.length; i++) {
                if (
                    items[i].status === item.status &&
                    items[i].type === item.type &&
                    items[i].isArchived === item.isArchived
                ) {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex !== -1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            newItems.splice(targetIndex, 0, item);
            setItems(newItems); // This changes order. React key ensures focus stays on the element.

            // Save Exact Order
            await saveNotebookOrderAction(newItems);
        }
    };



    const handleUpdateStatus = async (item: NotebookItem, direction: "prev" | "next") => {
        const statuses: readonly string[] = item.type === "topic" ? TOPIC_STATUSES : STEP_STATUSES;
        const currentIndex = statuses.indexOf(item.status);

        let newIndex = currentIndex;
        if (direction === "next") newIndex = Math.min(currentIndex + 1, statuses.length - 1);
        if (direction === "prev") newIndex = Math.max(currentIndex - 1, 0);

        if (newIndex !== currentIndex) {
            const newStatus = statuses[newIndex];

            // Optimistic Update with Timestamp update for sorting
            const now = new Date().toISOString();

            // Set completedAt if moving to final state
            let completedAt = item.completedAt;
            if (newStatus === "Done" || newStatus === "Ready") {
                completedAt = now;
            }

            // 1. Create updated item
            const updatedItem = { ...item, status: newStatus, updatedAt: now, completedAt };

            // 2. Re-assemble list with New Column Sorted
            // We use functional update to be safe, but we MUST move side effect out.
            // Actually, let's just use the current 'items' state for calculation since this is user interaction (not high frequency).

            const temp = items.map(i => i.id === item.id ? updatedItem : i);
            const colItems = temp.filter(i => i.status === newStatus && i.type === item.type);
            const otherItems = temp.filter(i => !(i.status === newStatus && i.type === item.type));
            const sortedCol = sortItemsByPriority(colItems);
            const final = [...sortedCol, ...otherItems];

            setItems(final);
            saveNotebookOrderAction(final);


            // Server Action
            try {
                await updateNotebookItemAction(item.id, { status: newStatus, completedAt });
            } catch (e) {
                console.error("Status update failed", e);
                loadItems(); // Revert on failure
            }

            // GENESIS TRIGGER (Only for Topics)
            if (
                item.type === "topic" && newStatus === "Scripting"
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
        // 1. OPTIMISTIC UI: Close modal immediately
        setEditingItem(null);

        // 2. OPTIMISTIC UPDATE: Update local state immediately
        // Include updated tags in the optimistic update
        const finalUpdates = { ...updates, tags: editItemTags };

        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...finalUpdates, updatedAt: new Date().toISOString() } : item
        ));

        // 3. BACKGROUND SYNC
        try {
            const result = await updateNotebookItemAction(id, finalUpdates);
            if (!result.success) {
                // If failed, revert the optimistic update
                console.error("Server denied update");
                await loadItems();
            }
        } catch (e) {
            console.error("Failed to update item", e);
            await loadItems(); // Revert to server state
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            // Topics
            case "Idea": return "border-slate-500/50 bg-slate-500/10 text-slate-400";
            case "Researching": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
            case "Scripting": return "border-purple-500/50 bg-purple-500/10 text-purple-400";
            case "Filming": return "border-red-500/50 bg-red-500/10 text-red-400";
            case "Polishing": return "border-pink-500/50 bg-pink-500/10 text-pink-400";
            case "Ready": return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";

            // Steps (User Requested Customization)
            // DONE -> grau
            case "Done": return "border-slate-500/50 bg-slate-500/10 text-slate-400";
            // Review -> orange
            case "Review": return "border-orange-500/50 bg-orange-500/10 text-orange-400";
            // IN PROGRESS -> grün (emerald matches 'Ready')
            case "In Progress": return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
            // next -> blau
            case "Next": return "border-sky-500/50 bg-sky-500/10 text-sky-400";
            // Backlog -> weiss
            case "Backlog": return "border-foreground/50 bg-foreground/10 text-foreground";

            default: return "border-border/50 bg-muted/20 text-muted-foreground";
        }
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

                {/* Trend Radar Button */}
                <button
                    onClick={() => setShowTrendRadar(true)}
                    className="mr-2 bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-400 border border-cyan-500/30 px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:brightness-125 transition-all shadow-lg shadow-cyan-900/20"
                >
                    <BrainCircuit className="w-5 h-5" />
                    <span className="hidden md:inline">Trend Radar</span>
                </button>

                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> New {activeTab === "topic" ? "Topic" : "Step"}
                </button>
            </div>

            {/* Modules */}
            {showTrendRadar && (
                <IdeaSearchModule
                    onClose={() => setShowTrendRadar(false)}
                    onAddIdea={() => {
                        loadItems(); // Refresh board
                        // Don't close immediately so user can add more
                    }}
                />
            )}

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

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 h-full min-w-max pb-4">
                    {statuses.map((status) => {
                        // 1. FILTER
                        let columnItems = filteredItems.filter(i => i.status === status);

                        // 2. FILTER & SORT

                        if (status === "Done" || status === "Ready") {
                            // Special Sort for Completed Items: Newest Completed First
                            columnItems.sort((a, b) => {
                                const timeA = new Date(a.completedAt || a.updatedAt).getTime();
                                const timeB = new Date(b.completedAt || b.updatedAt).getTime();
                                return timeB - timeA;
                            });
                        } else {
                            // Standard Priority Sort for Active Items
                            // columnItems.sort(...) <- Removed to allow manual reordering persistence
                        }

                        const statusStyle = getStatusColor(status);


                        const isCompactColumn = status === "Done"; // Compact view for "Done"

                        return (
                            <div key={status} className="w-64 min-w-[16rem] flex flex-col bg-muted/20 border border-border/50 rounded-xl h-full">
                                {/* Column Header */}
                                <div className={cn("p-4 border-b rounded-t-xl z-10 flex items-center justify-between sticky top-0 backdrop-blur-sm", statusStyle)}>
                                    <h3 className="font-bold text-sm tracking-wide uppercase">{status}</h3>
                                    <span className="bg-background/20 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {columnItems.length}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {columnItems.map(item => (
                                        <div
                                            key={item.id}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                // Reorder disabled
                                            }}
                                            className={cn(
                                                "bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-shadow group relative focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                                                isCompactColumn ? "p-2 pl-3" : "p-4"
                                            )}
                                        >
                                            {/* Priority Stripe */}
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                                                item.priority === "high" ? "bg-red-500" :
                                                    item.priority === "medium" ? "bg-yellow-500" :
                                                        "bg-blue-500"
                                            )} />

                                            <div className={cn("ml-2", isCompactColumn && "flex items-center justify-between")}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className={cn("font-bold text-sm leading-tight flex-1 mr-2", isCompactColumn && "mb-0")}>{item.title}</h4>
                                                    {!isCompactColumn && (
                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Reorder Buttons */}
                                                            <div className="flex flex-col -space-y-1 mb-1">
                                                                <button
                                                                    onClick={(e) => handleReorder(item, "up", e)}
                                                                    className="text-muted-foreground hover:text-foreground p-0.5 hover:bg-muted/50 rounded"
                                                                >
                                                                    <ChevronUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleReorder(item, "down", e)}
                                                                    className="text-muted-foreground hover:text-foreground p-0.5 hover:bg-muted/50 rounded"
                                                                >
                                                                    <ChevronDown className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {/* Edit Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingItem(item);
                                                                }}
                                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopy(item);
                                                                }}
                                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                                                title="Copy to Clipboard"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>

                                                            {item.status === "Idea" && item.type === "topic" && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        // 1. Move to Researching (Optimistic)
                                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "Researching" } : i));
                                                                        // 2. Server Update
                                                                        updateNotebookItemAction(item.id, { status: "Researching" });
                                                                        // 3. Redirect to Scanner
                                                                        const params = new URLSearchParams({
                                                                            mode: "research",
                                                                            q: item.title,
                                                                            desc: item.description
                                                                        });
                                                                        window.location.href = `/scanner?${params.toString()}`;
                                                                    }}
                                                                    className="p-1 hover:bg-emerald-500/10 hover:text-emerald-500 rounded text-muted-foreground transition-all"
                                                                    title="Start Research Protocol"
                                                                >
                                                                    <BrainCircuit className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compact Column Actions Overlay (Only Edit/Copy) */}
                                                {isCompactColumn && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingItem(item);
                                                            }}
                                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        {/* Archive Action for Done items */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleArchive(item);
                                                            }}
                                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                                            title="Archive"
                                                        >
                                                            <Archive className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}


                                                {/* Tags Display (Hidden in Compact) */}
                                                {!isCompactColumn && item.tags && item.tags.length > 0 && (
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

                                                {/* Description (Hidden in Compact) */}
                                                {!isCompactColumn && item.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {/* Footer (Hidden in Compact) */}
                                                {!isCompactColumn && (
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
                                                )}
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
