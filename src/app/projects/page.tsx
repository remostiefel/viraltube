"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FolderOpen,
    Plus,
    Search,
    MoreVertical,
    Pencil,
    Trash2,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowRight,
    Archive
} from "lucide-react";
import { getProjectsAction, createProjectAction, updateProjectAction, deleteProjectAction } from "@/app/actions";
import { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { useActionHistory } from "@/components/context/ActionHistoryContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Create/Edit State
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const data = await getProjectsAction();
        setProjects(data);
        setLoading(false);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectTitle.trim()) return;

        // Perform Action
        const newProject = await createProjectAction(newProjectTitle);
        setNewProjectTitle("");
        setIsCreating(false);
        await loadProjects();

        // Register Undo/Redo
        register({
            description: `Create Project '${newProjectTitle}'`,
            do: async () => {
                // Redo: Re-create with SAME ID to preserve any potential future links (though unlikely for a fresh create)
                await createProjectAction(newProject.title, newProject.format, newProject.id);
                await loadProjects();
            },
            undo: async () => {
                // Undo: Delete it
                await deleteProjectAction(newProject.id);
                await loadProjects();
            }
        });
    };

    const handleRename = async (id: string, newTitle: string) => {
        await updateProjectAction(id, { title: newTitle });
        setEditingId(null);
        loadProjects();
    };

    const { register } = useActionHistory();

    // ... create/rename logic remains same ...

    const handleArchive = async (id: string, archive: boolean) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        // "Do" Logic
        const doAction = async () => {
            await updateProjectAction(id, { status: archive ? "archived" : "production" });
            await loadProjects();
        };

        // "Undo" Logic
        const undoAction = async () => {
            await updateProjectAction(id, { status: archive ? "production" : "archived" }); // Revert status
            await loadProjects();
        };

        // UI Optimistic update (optional but good) or just wait for loadProjects inside doAction
        await doAction();

        // Register for history
        register({
            description: archive ? `Archive Project '${project.title}'` : `Unarchive Project '${project.title}'`,
            do: doAction,
            undo: undoAction
        });
    };

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setDeleteId(project.id);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete || !deleteId) return;
        const project = projectToDelete;
        const id = deleteId;

        // Save state for restoration
        const backup = { ...project };

        const doAction = async () => {
            await deleteProjectAction(id);
            await loadProjects();
        };

        const undoAction = async () => {
            // Restore with SAME ID to preserve asset links
            await createProjectAction(backup.title, backup.format, backup.id);
            // We might need to restore status too if it wasn't production? 
            // createProject defaults to production.
            if (backup.status !== "production") {
                await updateProjectAction(backup.id, { status: backup.status });
            }
            await loadProjects();
        };

        await doAction();

        register({
            description: `Delete Project '${project.title}'`,
            do: doAction,
            undo: undoAction
        });

        // Cleanup
        setDeleteId(null);
        setProjectToDelete(null);
    };

    const filteredProjects = projects
        .filter(p => {
            if (activeTab === "active") return p.status !== "archived" && p.status !== "draft";
            if (activeTab === "archived") return p.status === "archived";
            return false;
        })
        .filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FolderOpen className="w-8 h-8 text-primary" />
                        Project Hub
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Organize and manage your viral campaigns.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> New Project
                </button>
            </div>

            <div className="flex bg-muted p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab("active")}
                    className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "active" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                >
                    Active Projects
                </button>
                <button
                    onClick={() => setActiveTab("archived")}
                    className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "archived" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                >
                    Archived
                </button>
            </div>

            {/* Filtered Search - moved here to align with tabs if needed, but let's keep it clean */}


            {/* Creation Bar (Conditional) */}
            {
                isCreating && (
                    <div className="bg-muted/30 border border-border/50 p-4 rounded-xl animate-in slide-in-from-top-2">
                        <form onSubmit={handleCreateProject} className="flex gap-4 items-center">
                            <input
                                type="text"
                                value={newProjectTitle}
                                onChange={(e) => setNewProjectTitle(e.target.value)}
                                placeholder="Enter project name (e.g. 'Shorts Campaign 5')..."
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                            />
                            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold">Create</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground px-4 py-2">Cancel</button>
                        </form>
                    </div>
                )
            }

            {/* Search & Filter */}
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border/50">
                <Search className="w-5 h-5 text-muted-foreground ml-2" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "active" ? "Search active projects..." : "Search archived projects..."}
                    className="flex-1 bg-transparent border-none focus:outline-none py-2"
                />
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto bg-card rounded-xl border border-border/50 shadow-sm relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <FolderOpen className="w-12 h-12 opacity-20" />
                        <p>No projects found in {activeTab}.</p>
                        {searchQuery && <button onClick={() => setSearchQuery("")} className="text-primary hover:underline">Clear Search</button>}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredProjects.map((project) => (
                                <tr key={project.id} className="group hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        {editingId === project.id ? (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const form = e.target as HTMLFormElement;
                                                    const input = form.elements[0] as HTMLInputElement;
                                                    handleRename(project.id, input.value);
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    defaultValue={project.title}
                                                    className="bg-background border border-border rounded px-2 py-1 text-sm w-full"
                                                    autoFocus
                                                    onBlur={() => setEditingId(null)}
                                                />
                                            </form>
                                        ) : (
                                            <div className="font-medium text-foreground flex items-center gap-3">
                                                <Link href={`/project/${project.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                        <FolderOpen className="w-4 h-4" />
                                                    </span>
                                                    {project.title}
                                                </Link>
                                                {project.title.includes("Combo") && <span className="bg-purple-500/10 text-purple-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Strategy</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                            project.status === "done" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                project.status === "production" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                    project.status === "archived" ? "bg-gray-500/10 text-gray-500 border-gray-500/20" :
                                                        "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {project.status === "done" ? <CheckCircle2 className="w-3 h-3" /> :
                                                project.status === "production" ? <Clock className="w-3 h-3" /> :
                                                    project.status === "archived" ? <Archive className="w-3 h-3" /> :
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                            <span className="capitalize">{project.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/project/${project.id}`} className="p-2 hover:bg-primary/10 hover:text-primary rounded-md transition-colors" title="Open Project Hub">
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => setEditingId(project.id)}
                                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Rename"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleArchive(project.id, project.status !== 'archived')}
                                                className={cn("p-2 rounded-md transition-colors", project.status === 'archived' ? "text-blue-500 hover:bg-blue-500/10" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                                                title={project.status === 'archived' ? "Unarchive" : "Archive"}
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(project)}
                                                className="p-2 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors" title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Project?"
                description={`This will delete "${projectToDelete?.title}". You can undo this immediately, but otherwise it's permanent.`}
                onConfirm={handleConfirmDelete}
                confirmText="Delete Project"
                variant="destructive"
            />
        </div >
    );
}
