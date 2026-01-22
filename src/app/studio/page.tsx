"use client";

import { useState, useEffect } from "react";
import { Edit3, Save, RotateCcw, Code, AlertTriangle } from "lucide-react";
import { SYSTEM_PROMPTS, PromptKey } from "@/lib/prompts";
import { GROUP_COLORS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export default function PromptStudio() {
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [selectedKey, setSelectedKey] = useState<PromptKey>("blueprint");
    const [editValue, setEditValue] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Load overrides
        const saved = localStorage.getItem("nc_prompts_override");
        if (saved) {
            setOverrides(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        // When selection changes, load value (override or default)
        const currentOverride = overrides[selectedKey];
        setEditValue(currentOverride || SYSTEM_PROMPTS[selectedKey].template);
        setHasChanges(!!currentOverride);
    }, [selectedKey, overrides]);

    const handleSave = () => {
        const newOverrides = { ...overrides, [selectedKey]: editValue };
        setOverrides(newOverrides);
        localStorage.setItem("nc_prompts_override", JSON.stringify(newOverrides));
        setHasChanges(true);
    };

    const handleReset = () => {
        const newOverrides = { ...overrides };
        delete newOverrides[selectedKey];
        setOverrides(newOverrides);
        localStorage.setItem("nc_prompts_override", JSON.stringify(newOverrides));
        setEditValue(SYSTEM_PROMPTS[selectedKey].template);
        setHasChanges(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Code className="w-8 h-8 text-primary" />
                        Engine Room
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Modify the DNA of your AI agents.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Sidebar List */}
                <div className="col-span-3 bg-card border border-border/40 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 bg-muted/20 border-b border-border/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        System Agents
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {Object.values(SYSTEM_PROMPTS).map((prompt) => {
                            // @ts-ignore - category is added in the lib file but TS might not infer it immediately if types aren't fully updated in the same compilation context, or if the type definition wasn't updated. 
                            // Actually I should verify the type definition in prompts.ts. I didn't update the type definition in the previous step, only the values. 
                            // Wait, I replaced the content of the object, so TS should infer it if 'typeof SYSTEM_PROMPTS' is used.
                            // Let's safe guard it.
                            const category = (prompt as any).category || "DASHBOARD";
                            const colorVar = GROUP_COLORS[category] || "var(--foreground)";

                            return (
                                <button
                                    key={prompt.id}
                                    onClick={() => setSelectedKey(prompt.id as PromptKey)}
                                    className={cn(
                                        "w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col gap-1 border border-transparent",
                                        selectedKey === prompt.id
                                            ? "bg-muted shadow-sm"
                                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                    )}
                                    style={selectedKey === prompt.id ? {
                                        borderColor: colorVar,
                                        boxShadow: `inset 4px 0 0 0 ${colorVar}`
                                    } : {}}
                                >
                                    <span
                                        className={cn("font-bold flex items-center justify-between")}
                                        style={{ color: selectedKey === prompt.id ? colorVar : undefined }}
                                    >
                                        {prompt.label}
                                        <span
                                            className="w-2 h-2 rounded-full opacity-50"
                                            style={{ backgroundColor: colorVar }}
                                        />
                                    </span>
                                    <span className="text-[10px] opacity-70 truncate w-full block">
                                        {prompt.description}
                                    </span>
                                    {overrides[prompt.id] && (
                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded w-fit uppercase font-bold tracking-wider">
                                            Modified
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="col-span-9 flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/10">
                        <div className="flex items-center gap-3">
                            <span className="font-bold">{SYSTEM_PROMPTS[selectedKey].label}</span>
                            {hasChanges && (
                                <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Custom Version Active
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleReset}
                                disabled={!hasChanges}
                                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset to Default
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Save className="w-3 h-3" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Editor Info */}
                    <div className="px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/10 text-xs text-yellow-600/80">
                        <strong>Variables:</strong> Keep the <code>{"{{variable}}"}</code> placeholders intact so the dynamic data can be injected.
                    </div>

                    {/* Textarea */}
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-primary/20"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
