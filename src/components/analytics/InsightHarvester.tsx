"use client";

import { useState } from "react";
import { WisdomCandidate } from "@/lib/wisdom-extractor";
import { addPendingInsights } from "@/lib/pending-insights";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Edit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightHarvesterProps {
    insights: WisdomCandidate[];
    open: boolean;
    onClose: () => void;
    sourceTitle: string;
}

export function InsightHarvester({ insights, open, onClose, sourceTitle }: InsightHarvesterProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(insights.map((_, i) => i)));
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedInsights, setEditedInsights] = useState<WisdomCandidate[]>(insights);

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIds(newSet);
    };

    const handleEdit = (index: number) => {
        setEditingId(index);
    };

    const handleSaveEdit = (index: number, principle: string, explanation: string) => {
        const updated = [...editedInsights];
        updated[index] = {
            ...updated[index],
            principle,
            explanation
        };
        setEditedInsights(updated);
        setEditingId(null);
    };

    const handleSaveToWisdom = () => {
        const selected = editedInsights.filter((_, i) => selectedIds.has(i));
        addPendingInsights(selected);
        onClose();
    };

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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        Harvest Insights from Analysis
                    </DialogTitle>
                    <DialogDescription>
                        {insights.length} pattern{insights.length !== 1 ? "s" : ""} detected from "{sourceTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {editedInsights.map((insight, index) => (
                        <div
                            key={index}
                            className={cn(
                                "p-4 rounded-lg border-2 transition-all",
                                getCategoryColor(insight.category),
                                selectedIds.has(index) ? "ring-2 ring-offset-2 ring-offset-background" : "opacity-60"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(index)}
                                    onChange={() => toggleSelection(index)}
                                    className="mt-1 w-5 h-5 accent-primary cursor-pointer"
                                />

                                <div className="flex-1 space-y-2">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded font-bold uppercase",
                                            getCategoryBadgeColor(insight.category)
                                        )}>
                                            {insight.category}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    {editingId === index ? (
                                        <EditMode
                                            insight={insight}
                                            onSave={(principle, explanation) => handleSaveEdit(index, principle, explanation)}
                                            onCancel={() => setEditingId(null)}
                                        />
                                    ) : (
                                        <>
                                            <h4 className="font-bold text-foreground">{insight.principle}</h4>
                                            <p className="text-sm text-muted-foreground">{insight.explanation}</p>
                                        </>
                                    )}

                                    {/* Confidence Bar */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Confidence:</span>
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                                                style={{ width: `${insight.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{Math.round(insight.confidence * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t mt-6">
                    <span className="text-sm text-muted-foreground">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveToWisdom}
                            disabled={selectedIds.size === 0}
                            className="px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Add to Pending Review
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditMode({ insight, onSave, onCancel }: {
    insight: WisdomCandidate;
    onSave: (principle: string, explanation: string) => void;
    onCancel: () => void;
}) {
    const [principle, setPrinciple] = useState(insight.principle);
    const [explanation, setExplanation] = useState(insight.explanation);

    return (
        <div className="space-y-2">
            <input
                value={principle}
                onChange={(e) => setPrinciple(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary"
                placeholder="Principle"
            />
            <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                placeholder="Explanation"
            />
            <div className="flex gap-2">
                <button
                    onClick={() => onSave(principle, explanation)}
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                    <Check className="w-4 h-4" />
                </button>
                <button
                    onClick={onCancel}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
