"use client";

import { useMemo } from "react";
import { Project } from "@/lib/projects";
import { Template } from "@/lib/templates";
import { Check, ArrowRight, Lightbulb, Play, PencilRuler, Radar, Clapperboard, FolderOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProjectWorkflowStatusProps {
    project: Project;
    assets: Template[];
}

export function ProjectWorkflowStatus({ project, assets }: ProjectWorkflowStatusProps) {

    // Determine Step Status
    const steps = useMemo(() => {
        // Step 1: Scanner (Always "done" if we have a project, as it's the entry point ideally, or we assume data led here)
        // If it's a "Combo" project, it definitely came from scanner. If manual, maybe not?
        // Let's assume Step 1 is "Foundation" and always done for now. 
        const step1 = true;

        // Step 2: Strategy (Format/Description present)
        const step2 = !!(project.format && project.format.length > 20); // Arbitrary length to ensure real content

        // Step 3: Script (Asset of type 'script' linked to project)
        // Check for ANY script in assets
        const scriptAssets = assets.filter(a => a.type === 'script' || a.type === 'viral-wisdom');
        const step3 = scriptAssets.length > 0;

        // Step 4: Production (Asset of type 'prompt' linked to project)
        const promptAssets = assets.filter(a => a.type === 'prompt');
        const step4 = promptAssets.length > 0;

        return [
            { id: 1, label: "Scanner", icon: Radar, done: step1, link: "/scanner" },
            { id: 2, label: "Strategy", icon: FolderOpen, done: step2, link: `/architect?project=${project.id}&tab=strategy` },
            { id: 3, label: "Script", icon: PencilRuler, done: step3, link: `/architect?project=${project.id}&tab=script` },
            { id: 4, label: "Production", icon: Clapperboard, done: step4, link: `/architect?project=${project.id}&tab=director` }
        ];
    }, [project, assets]);

    // Determine Current Active Step (First non-done step)
    const activeStepIndex = steps.findIndex(s => !s.done);
    const currentStep = activeStepIndex === -1 ? steps[steps.length - 1] : steps[activeStepIndex];
    const isCompleted = activeStepIndex === -1;

    // Manager Tips
    const getTip = () => {
        if (activeStepIndex === 0) return "Start by finding a viral outlier in the Scanner."; // Should technically not happen if step 1 is always true
        if (activeStepIndex === 1) return { text: "Next: Define your Strategy.", sub: "The 'Strategy' tab in Architect will autosynthesize your plan.", action: "Launch Strategy Forge", link: steps[1].link };
        if (activeStepIndex === 2) return { text: "Strategy locked. Now: Write the Script.", sub: "Use the 'Script Architect' to draft your content.", action: "Draft Script", link: steps[2].link };
        if (activeStepIndex === 3) return { text: "Script ready. Next: Director Mode.", sub: "Generate AI prompts for video production.", action: "Enter Director Mode", link: steps[3].link };
        return { text: "Pipeline Complete!", sub: "You're ready to film and upload.", action: "View Project", link: null };
    };

    const tip = getTip();

    return (
        <div className="space-y-6">
            {/* Stepper Logic */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted/50 -translate-y-1/2 rounded-full z-0" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary/50 to-primary -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
                    style={{ width: `${((steps.filter(s => s.done).length - 1) / (steps.length - 1)) * 100}%` }}
                />

                <div className="relative z-10 flex justify-between">
                    {steps.map((step, idx) => {
                        const isDone = step.done;
                        const isActive = idx === activeStepIndex;
                        const isFuture = !isDone && !isActive;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default">
                                <Link href={step.link} className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background shadow-sm hover:scale-110",
                                    isDone ? "border-primary text-primary" :
                                        isActive ? "border-primary/50 text-foreground ring-4 ring-primary/10" :
                                            "border-muted text-muted-foreground bg-muted/50"
                                )}>
                                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="font-bold font-mono text-sm">{step.id}</span>}
                                </Link>
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider transition-colors",
                                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Smart Manager Action */}
            {!isCompleted && typeof tip === 'object' && tip.link && (
                <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/20 p-2 rounded-lg text-primary mt-1">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-widest">
                                    Step {activeStepIndex + 1}
                                </span>
                                {tip.text}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                {tip.sub}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={tip.link}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 group"
                    >
                        {tip.action} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            )}

            {isCompleted && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                        <Check className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-green-700 dark:text-green-400">All Systems Go!</h4>
                        <p className="text-sm text-muted-foreground">This project has completed the standard Neuro-Pipeline.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
