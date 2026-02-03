"use client";

import { useState, useEffect } from "react";
import { getPendingInsights, updatePendingInsight, deletePendingInsight, PendingInsight } from "@/lib/pending-insights";
import { saveTemplateAction } from "@/app/actions";
import { Sparkles, Check, X, Edit, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export function PendingInsightsManager() {
    const [insights, setInsights] = useState<PendingInsight[]>([]);
    const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
    const { toast } = useToast();

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = () => {
        const all = getPendingInsights();
        setInsights(all);
    };

    const handleApprove = async (insight: PendingInsight) => {
        try {
            // Save to Wisdom Pool
            await saveTemplateAction(
                "viral-wisdom",
                insight.candidate.principle,
                {
                    principle: insight.candidate.principle,
                    explanation: insight.candidate.explanation,
                    description: insight.candidate.explanation,
                    optimizationPrompt: `${insight.candidate.category}: ${insight.candidate.principle}`,
                    metadata: {
                        source: insight.candidate.source,
                        sourceId: insight.candidate.sourceId,
                        confidence: insight.candidate.confidence,
                        ...insight.candidate.metadata
                    }
                },
                undefined,
                [insight.candidate.source, `confidence-${Math.round(insight.candidate.confidence * 100)}`],
                Math.round(insight.candidate.confidence * 10),
                insight.candidate.category
            );

            // Update status
            updatePendingInsight(insight.id, {
                status: "APPROVED",
                reviewedAt: new Date().toISOString()
            });

            loadInsights();
            toast({
                title: "Insight Approved!",
                description: "Added to Wisdom Pool successfully."
            });
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "Failed to approve insight.",
                variant: "destructive"
            });
        }
    };

    const handleReject = (id: string) => {
        updatePendingInsight(id, {
            status: "REJECTED",
            reviewedAt: new Date().toISOString()
        });
        loadInsights();
        toast({
            title: "Insight Rejected",
            description: "Moved to rejected list."
        });
    };

    const handleDelete = (id: string) => {
        deletePendingInsight(id);
        loadInsights();
        toast({
            title: "Insight Deleted",
            description: "Permanently removed from queue."
        });
    };

    const filteredInsights = filter === "PENDING"
        ? insights.filter(i => i.status === "PENDING")
        : insights;

    const pendingCount = insights.filter(i => i.status === "PENDING").length;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "LAW": return "border-purple-500 bg-purple-500/10";
            case "GROWTH": return "border-yellow-500 bg-yellow-500/10";
            case "FACT": return "border-green-500 bg-green-500/10";
            default: return "border-border bg-muted/10";
        }
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case "LAW": return "bg-purple-500/20 text-purple-400";
            case "GROWTH": return "bg-yellow-500/20 text-yellow-500";
            case "FACT": return "bg-green-500/20 text-green-500";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getSourceBadge = (source: string) => {
        const badges = {
            "FULL_SCAN": { label: "Full Scan", color: "bg-blue-500/20 text-blue-400" },
            "SURGEON": { label: "Surgeon", color: "bg-red-500/20 text-red-400" },
            "AUDIT": { label: "Audit", color: "bg-green-500/20 text-green-400" }
        };
        return badges[source as keyof typeof badges] || { label: source, color: "bg-muted text-muted-foreground" };
    };

    if (filteredInsights.length === 0) {
        return (
            <div className="text-center py-12 opacity-50">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-bold">No Pending Insights</p>
                <p className="text-sm text-muted-foreground">Harvest insights from your analytics to see them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        Pending Insights Review
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pendingCount} insight{pendingCount !== 1 ? "s" : ""} awaiting your review
                    </p>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("PENDING")}
                        className={cn(
                            "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                            filter === "PENDING"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => setFilter("ALL")}
                        className={cn(
                            "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                            filter === "ALL"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        All ({insights.length})
                    </button>
                </div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {filteredInsights.map((insight) => {
                    const sourceBadge = getSourceBadge(insight.candidate.source);

                    return (
                        <div
                            key={insight.id}
                            className={cn(
                                "p-6 rounded-lg border-2 transition-all",
                                getCategoryColor(insight.candidate.category),
                                insight.status === "APPROVED" && "opacity-60",
                                insight.status === "REJECTED" && "opacity-40"
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex gap-2 flex-wrap">
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded font-bold uppercase",
                                        getCategoryBadgeColor(insight.candidate.category)
                                    )}>
                                        {insight.candidate.category}
                                    </span>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded font-bold",
                                        sourceBadge.color
                                    )}>
                                        {sourceBadge.label}
                                    </span>
                                    {insight.status !== "PENDING" && (
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded font-bold",
                                            insight.status === "APPROVED" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                        )}>
                                            {insight.status}
                                        </span>
                                    )}
                                </div>

                                {insight.status === "PENDING" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(insight)}
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                            title="Approve & Add to Wisdom Pool"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(insight.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(insight.id)}
                                            className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <h4 className="font-bold text-lg mb-2">{insight.candidate.principle}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{insight.candidate.explanation}</p>

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {insight.candidate.metadata.videoTitle && (
                                    <span>📹 {insight.candidate.metadata.videoTitle.slice(0, 40)}...</span>
                                )}
                                <span>Confidence: {Math.round(insight.candidate.confidence * 100)}%</span>
                                <span>{new Date(insight.candidate.metadata.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
