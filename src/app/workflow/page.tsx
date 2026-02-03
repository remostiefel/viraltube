"use client";

import { CortexSidebar } from "@/components/cortex/CortexSidebar";
import { Activity, ArrowRight, Brain, CheckCircle, FileText, Scan, Zap, LayoutDashboard, PenTool, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StrategyMapPage() {
    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden font-sans">
            <header className="h-14 border-b border-white/10 flex items-center px-6 bg-black/40 backdrop-blur-sm z-10 justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h1 className="text-lg font-bold tracking-widest text-white uppercase">Cortex Strategy Map</h1>
                </div>
                <span className="text-xs text-neutral-500 font-mono">PROTOCOL 2026: THE OPTIMAL PATH</span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <CortexSidebar />

                <main className="flex-1 relative flex flex-col p-8 overflow-auto items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-neutral-950 to-black">

                    <div className="max-w-5xl w-full space-y-12">

                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                                The Neuro-Code Workflow
                            </h2>
                            <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
                                Follow this precise sequence to transform raw noise into viral signal.
                                This is your map through the system.
                            </p>
                        </div>

                        {/* THE PIPELINE VISUALIZATION */}
                        <div className="relative">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-900 via-cyan-900 to-green-900 -translate-y-1/2 z-0 opacity-50" />

                            <div className="grid grid-cols-5 gap-4 relative z-10">

                                {/* NODE 1: DISCOVERY */}
                                <WorkflowNode
                                    step="01"
                                    title="Discovery"
                                    icon={Scan}
                                    color="text-blue-400"
                                    borderColor="border-blue-500/50"
                                    description="Identify outliers & viral sparks."
                                    link="/scanner"
                                    actionLabel="Open Scanner"
                                />

                                {/* NODE 2: INCUBATION */}
                                <WorkflowNode
                                    step="02"
                                    title="Incubation"
                                    icon={Brain}
                                    color="text-purple-400"
                                    borderColor="border-purple-500/50"
                                    description="Refine concepts in the Notebook."
                                    link="/notebook" // Assuming notebook is accessible here, or scanner
                                    actionLabel="Go to Notebook"
                                />

                                {/* NODE 3: CONSTRUCTION */}
                                <WorkflowNode
                                    step="03"
                                    title="Construction"
                                    icon={PenTool}
                                    color="text-cyan-400"
                                    borderColor="border-cyan-500/50"
                                    description="Script Forge & Architect."
                                    link="/architect"
                                    actionLabel="Open Architect"
                                />

                                {/* NODE 4: VALIDATION */}
                                <WorkflowNode
                                    step="04"
                                    title="Validation"
                                    icon={Activity}
                                    color="text-yellow-400"
                                    borderColor="border-yellow-500/50"
                                    description="Traffic Light & Science Check."
                                    link="/"
                                    actionLabel="Check Dashboard"
                                />

                                {/* NODE 5: PRODUCTION */}
                                <WorkflowNode
                                    step="05"
                                    title="Production"
                                    icon={Download}
                                    color="text-green-400"
                                    borderColor="border-green-500/50"
                                    description="Export & Filming."
                                    link="/architect?tab=script" // Best place to download currently
                                    actionLabel="Export Script"
                                />

                            </div>
                        </div>

                        {/* CONTEXTUAL HELP / COACH NOTE */}
                        <div className="mt-16 bg-neutral-900/50 border border-white/10 rounded-xl p-6 flex gap-6 max-w-3xl mx-auto backdrop-blur-sm">
                            <div className="p-3 bg-cyan-900/20 rounded-full h-fit">
                                <Zap className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Coach's Directive</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    "Do not skip the <strong>Validation Phase</strong>. A green light on the dashboard saves you 4 hours of filming a bad idea.
                                    If you are targeting the 35+ Engineer, use the <strong>Scanner</strong> to find 'Deep Science' papers first."
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

function WorkflowNode({ step, title, icon: Icon, color, borderColor, description, link, actionLabel }: any) {
    return (
        <div className="group relative">
            <Link href={link}>
                <div className={cn(
                    "bg-black border-2 rounded-2xl p-6 h-64 flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)]",
                    borderColor,
                    "hover:shadow-cyan-900/20"
                )}>
                    <div className="text-xs font-mono text-neutral-600 mb-2">{step}</div>

                    <div className={cn("p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors mb-2", color)}>
                        <Icon className="w-8 h-8" />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-xs text-neutral-400 leading-normal px-2">{description}</p>
                    </div>

                    <div className={cn(
                        "mt-4 text-xs font-bold uppercase tracking-widest py-2 px-4 rounded border border-white/10 group-hover:bg-white group-hover:text-black transition-all",
                        color
                    )}>
                        {actionLabel}
                    </div>
                </div>
            </Link>

            {/* Arrow for next step (except last) */}
            {step !== "05" && (
                <div className="absolute top-1/2 -right-6 -translate-y-1/2 z-20 hidden md:block text-neutral-700">
                    <ArrowRight className="w-6 h-6" />
                </div>
            )}
        </div>
    );
}
