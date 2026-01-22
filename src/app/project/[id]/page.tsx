"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    FolderOpen,
    Settings,
    MoreHorizontal,
    PencilRuler,
    Radar,
    Play,
    Brain,
    Pencil,
    X,
    Check,
    Search,
    Trash2
} from "lucide-react";
import { getProjectByIdAction, getTemplatesAction, linkTemplateToProjectAction, updateTemplateAction, unlinkTemplateFromProjectAction } from "@/app/actions";
import { Project } from "@/lib/projects";
import { Template } from "@/lib/templates"; // Import Template type
import { cn } from "@/lib/utils";
import { useActionHistory } from "@/components/context/ActionHistoryContext";
import { ProjectWorkflowStatus } from "@/components/project/ProjectWorkflowStatus";

export default function ProjectHubPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Template[]>([]);
    const [library, setLibrary] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (id) {
            loadProject(id);
        }
    }, [id]);

    const loadProject = async (projectId: string) => {
        setLoading(true);
        const [projectData, projectAssets, allTemplates] = await Promise.all([
            getProjectByIdAction(projectId),
            getTemplatesAction(undefined, projectId),
            getTemplatesAction()
        ]);

        if (projectData) {
            setProject(projectData);
            setAssets(projectAssets);
            // Filter library to exclude already linked items
            setLibrary(allTemplates.filter(t => t.projectId !== projectId));
        } else {
            alert("Project not found");
            router.push("/projects");
        }
        setLoading(false);
    };

    const { register } = useActionHistory();

    const addToProject = async (templateId: string) => {
        await linkTemplateToProjectAction(templateId, id);
        // Refresh local state purely for speed
        const template = library.find(t => t.id === templateId);
        if (template) {
            setAssets([...assets, { ...template, projectId: id }]);
            setLibrary(library.filter(t => t.id !== templateId));
        }
    };

    const unlinkFromProject = async (templateId: string) => {
        const asset = assets.find(t => t.id === templateId);
        if (!asset) return;

        const doAction = async () => {
            // Optimistic
            setAssets(prev => prev.filter(t => t.id !== templateId));
            setLibrary(prev => [...prev, { ...asset, projectId: undefined }]);
            await unlinkTemplateFromProjectAction(templateId);
        };

        const undoAction = async () => {
            // Optimistic
            setLibrary(prev => prev.filter(t => t.id !== templateId));
            setAssets(prev => [...prev, asset]);
            await linkTemplateToProjectAction(templateId, id);
        };

        await doAction();

        register({
            description: `Remove '${asset.name}' from Project`,
            do: doAction,
            undo: undoAction
        });
    };

    const startEditing = (asset: Template) => {
        setEditingId(asset.id);
        setEditName(asset.name);
    };

    const cycleVersion = async (asset: Template) => {
        const statuses: ("draft" | "beta" | "final")[] = ["draft", "beta", "final"];
        const currentIdx = statuses.indexOf(asset.versionStatus || "draft");
        const nextStatus = statuses[(currentIdx + 1) % statuses.length];
        const prevStatus = asset.versionStatus || "draft";

        const updateStatus = async (status: "draft" | "beta" | "final") => {
            const updatedAssets = assets.map(a => a.id === asset.id ? { ...a, versionStatus: status } : a);
            setAssets(updatedAssets);
            await updateTemplateAction(asset.id, { versionStatus: status });
        };

        const doAction = async () => {
            await updateStatus(nextStatus);
        };

        const undoAction = async () => {
            await updateStatus(prevStatus);
        };

        await doAction();

        register({
            description: `Change status of '${asset.name}' to ${nextStatus}`,
            do: doAction,
            undo: undoAction
        });
    };

    const saveRename = async () => {
        if (!editingId || !editName.trim()) return;

        // Optimistic Update
        const updatedAssets = assets.map(a => a.id === editingId ? { ...a, name: editName } : a);
        setAssets(updatedAssets);

        await updateTemplateAction(editingId, { name: editName });
        setEditingId(null);
    };

    if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading Project Hub...</div>;
    if (!project) return null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/30 pb-6">
                <Link href="/projects" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Project Hub</div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                </div>
                <div className="ml-auto flex gap-2">
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold uppercase self-center">
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Neuro-Pipeline Tracker */}
            <ProjectWorkflowStatus project={project} assets={assets} />

            {/* Quick Actions / Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Research / Scanner */}
                <Link href="/scanner" className="group block">
                    <div className="bg-card border border-border/50 hover:border-primary/50 transition-all p-6 rounded-xl shadow-sm h-full hover:shadow-lg hover:shadow-primary/5">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Radar className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Trend Scout</h3>
                        <p className="text-sm text-muted-foreground">Find outliers and viral formats for this project.</p>
                    </div>
                </Link>

                {/* 2. Strategy / Architect */}
                <Link href={`/architect?project=${project.id}`} className="group block">
                    <div className="bg-card border border-border/50 hover:border-purple-500/50 transition-all p-6 rounded-xl shadow-sm h-full hover:shadow-lg hover:shadow-purple-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-10 -mt-10" />
                        <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <PencilRuler className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Script Architect</h3>
                        <p className="text-sm text-muted-foreground">Draft scripts and strategies. Context loaded automatically.</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-purple-500">
                            Launch Editor <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* 3. Production / Flow */}
                <div className="bg-card/50 border border-border/30 p-6 rounded-xl opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-muted text-muted-foreground rounded-lg flex items-center justify-center mb-4">
                        <Play className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Production Line</h3>
                    <p className="text-sm text-muted-foreground">Workflow pipelines coming soon.</p>
                </div>
            </div>

            {/* Project Assets / Inventory */}
            <div className="mt-12 space-y-8">
                <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-muted-foreground" />
                        Project Inventory
                    </h3>

                    {assets.length === 0 ? (
                        <div className="bg-muted/10 border border-dashed border-border/50 rounded-xl p-8 text-center text-muted-foreground">
                            <p>No assets in this project yet.</p>
                            <p className="text-xs mt-2">Import from your Library below.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assets.map(asset => (
                                <div key={asset.id} className="bg-card border border-border/50 p-4 rounded-xl flex items-start gap-3 hover:border-primary/30 transition-colors group relative">
                                    <Link
                                        href={asset.type === 'script' || asset.type === 'viral-wisdom' ? `/architect?project=${id}&templateId=${asset.id}` : '#'}
                                        onClick={(e) => {
                                            if (editingId === asset.id) e.preventDefault(); // Disable link while editing
                                        }}
                                        className="bg-primary/10 p-2 rounded-lg text-primary shrink-0 hover:bg-primary/20 transition-colors cursor-pointer"
                                    >
                                        {asset.type === 'script' ? <PencilRuler className="w-4 h-4" /> :
                                            asset.type === 'prompt' ? <Brain className="w-4 h-4" /> :
                                                <FolderOpen className="w-4 h-4" />}
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start h-6">
                                            {editingId === asset.id ? (
                                                <div className="flex items-center gap-1 w-full">
                                                    <input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 bg-muted px-2 py-0.5 rounded text-sm min-w-0"
                                                        autoFocus
                                                    />
                                                    <button onClick={saveRename} className="p-1 hover:bg-green-500/10 text-green-500 rounded"><Check className="w-3 h-3" /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><X className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={asset.type === 'script' || asset.type === 'viral-wisdom' ? `/architect?project=${id}&templateId=${asset.id}` : '#'}
                                                        className="font-bold text-sm truncate pr-2 hover:text-primary transition-colors cursor-pointer block"
                                                    >
                                                        {asset.name}
                                                    </Link>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEditing(asset);
                                                            }}
                                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                            title="Rename"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // No confirm needed thanks to Undo/Redo
                                                                unlinkFromProject(asset.id);
                                                            }}
                                                            className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                                                            title="Remove from Project"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                        <div className="h-4 w-px bg-border/50 mx-1" />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                cycleVersion(asset);
                                                            }}
                                                            className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded font-bold transition-all hover:scale-105",
                                                                asset.versionStatus === 'final' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                                                                    asset.versionStatus === 'beta' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" :
                                                                        "bg-muted text-muted-foreground hover:bg-muted/80"
                                                            )}
                                                            title="Click to change status"
                                                        >
                                                            {asset.versionStatus || "draft"}
                                                        </button>
                                                        <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{asset.type}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            Created {new Date(asset.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Import from Library */}
                <div className="border-t border-border/30 pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
                            <FolderOpen className="w-4 h-4" />
                            Available in Library (Click to Add)
                        </h3>
                        {/* Search for Library */}
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <input
                                placeholder="Search library..."
                                className="bg-muted/30 border border-border/50 rounded-full pl-7 pr-3 py-1 text-xs w-48 focus:outline-none focus:border-primary/50"
                                onChange={(e) => {
                                    // Simple local filter (could be state based)
                                    const val = e.target.value.toLowerCase();
                                    const buttons = document.querySelectorAll('.library-item-btn');
                                    buttons.forEach(btn => {
                                        const text = btn.textContent?.toLowerCase() || '';
                                        (btn as HTMLElement).style.display = text.includes(val) ? 'flex' : 'none';
                                    });
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
                        {library.map(asset => (
                            <button
                                key={asset.id}
                                onClick={() => addToProject(asset.id)}
                                className="library-item-btn bg-muted/20 border border-transparent hover:border-green-500/50 hover:bg-green-500/5 p-3 rounded-lg text-left transition-all group flex items-center gap-2"
                            >
                                <div className="text-muted-foreground group-hover:text-green-500 transition-colors shrink-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 overflow-hidden">
                                    <h4 className="font-bold text-xs truncate group-hover:text-green-600 transition-colors">{asset.name}</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase truncate">{asset.type}</p>
                                </div>
                            </button>
                        ))}
                        {library.length === 0 && <span className="text-sm text-muted-foreground italic col-span-full text-center py-4">No unlinked items in library.</span>}
                    </div>
                </div>
            </div>

            {/* Project Artifacts (Legacy / Main Strategy) */}
            <div className="mt-12 hidden">
                {/* Hiding legacy artifacts section to avoid confusion if we are moving to generalized assets */}
            </div>
        </div>
    );
}
