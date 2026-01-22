"use client";

import { useState, useEffect } from "react";
import { Workflow, Play, CheckCircle, Circle, AlertCircle, Loader2, TrendingUp, Beaker, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_PIPELINES, Pipeline } from "@/lib/pipelines";
import { StrategyProfile } from "@/lib/gemini";

export default function PipelinesPage() {
    const [activePipeline, setActivePipeline] = useState<string | null>(null);
    const [pipelineState, setPipelineState] = useState<Pipeline | null>(null);
    const [input, setInput] = useState("");
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | undefined>(undefined);

    useEffect(() => {
        const saved = localStorage.getItem("nc_cortex_profile");
        if (saved) {
            setCortexProfile(JSON.parse(saved));
        }
    }, []);

    const startPipeline = (p: Pipeline) => {
        // Create a fresh copy of steps to avoid mutating the original definition
        // but preserve the 'execute' function reference
        const freshPipeline: Pipeline = {
            ...p,
            steps: p.steps.map(step => ({ ...step }))
        };
        setPipelineState(freshPipeline);
        setActivePipeline(p.id);
        setInput(""); // Reset previous input
    };

    const run = async () => {
        if (!pipelineState || !input) return;

        // Execute
        const overrides = localStorage.getItem("nc_prompts_override");
        await pipelineState.execute(input, cortexProfile, (stepId, status, result) => {
            setPipelineState(prev => {
                if (!prev) return null;
                const newSteps = prev.steps.map(s =>
                    s.id === stepId ? { ...s, status, result } : s
                );
                return { ...prev, steps: newSteps };
            });
        }, overrides ? JSON.parse(overrides) : undefined);
    };

    const reset = () => {
        setActivePipeline(null);
        setPipelineState(null);
        setInput("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Workflow className="w-8 h-8 text-primary" />
                    Flow Engine
                </h2>
                <p className="text-muted-foreground mt-2">
                    Automated protocols to scale your content production.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_PIPELINES.map(p => (
                    <div
                        key={p.id}
                        className={cn(
                            "bg-card border p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer group flex flex-col",
                            activePipeline === p.id ? "border-primary ring-2 ring-primary/20" : "border-border/40"
                        )}
                        onClick={() => startPipeline(p)}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                {p.icon === "TrendingUp" && <TrendingUp className="w-6 h-6" />}
                                {p.icon === "Beaker" && <Beaker className="w-6 h-6" />}
                            </div>
                            <h3 className="font-bold text-lg">{p.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex-1 mb-6">
                            {p.description}
                        </p>
                        <div className="text-xs font-mono bg-muted/30 p-2 rounded text-muted-foreground">
                            {p.steps.length} Steps • Automation: 100%
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Pipeline Runner */}
            {activePipeline && pipelineState && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-2xl w-full p-8 space-y-8 relative animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={reset} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">X</button>

                        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                            <div className="p-3 bg-primary/20 rounded-xl text-primary">
                                <Workflow className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{pipelineState.name}</h3>
                                <p className="text-muted-foreground">Protocol Active</p>
                            </div>
                        </div>

                        {/* Input Phase */}
                        {!pipelineState.steps.some(s => s.status !== "pending") && (
                            <div className="space-y-4">
                                <label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                    Protocol Input
                                </label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={pipelineState.inputLabel}
                                        className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary/50 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={run}
                                        disabled={!input}
                                        className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        Run Protocol <Play className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Execution Phase */}
                        <div className="space-y-6">
                            {pipelineState.steps.map((step, i) => (
                                <div key={step.id} className="flex items-start gap-4 relative">
                                    {/* Connector Line */}
                                    {i < pipelineState.steps.length - 1 && (
                                        <div className={cn(
                                            "absolute left-[15px] top-[30px] bottom-[-30px] w-[2px]",
                                            step.status === "completed" ? "bg-green-500" : "bg-border/30"
                                        )} />
                                    )}

                                    <div className="mt-1">
                                        {step.status === "pending" && <Circle className="w-8 h-8 text-muted-foreground/30" />}
                                        {step.status === "running" && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
                                        {step.status === "completed" && <CheckCircle className="w-8 h-8 text-green-500" />}
                                        {step.status === "failed" && <AlertCircle className="w-8 h-8 text-red-500" />}
                                    </div>
                                    <div className="flex-1 bg-muted/20 p-4 rounded-lg border border-border/30">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={cn("font-bold", step.status === "running" && "text-primary")}>
                                                {step.name}
                                            </h4>
                                            <span className="text-xs font-mono uppercase text-muted-foreground">{step.status}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{step.description}</p>

                                        {step.result && (
                                            <div className="mt-3 text-sm bg-background/50 p-2 rounded border border-border/50 font-mono text-green-600 dark:text-green-400">
                                                {step.result}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pipelineState.steps.every(s => s.status === "completed") && (
                            <div className="flex justify-end pt-4">
                                <button onClick={() => window.location.href = "/"} className="text-primary font-bold hover:underline flex items-center gap-2">
                                    View Results in Dashboard <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
