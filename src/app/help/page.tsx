"use client";

import { useState } from "react";
import { BookOpen, Map, Zap, FileText, ChevronRight, HelpCircle, Bot, ArrowRight, Database, GraduationCap, GitMerge } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { motion } from "framer-motion";

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "quickstart" | "manual" | "workflow">("overview");

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-primary" />
                    Knowledge Base
                </h2>
                <p className="text-muted-foreground mt-2">
                    Master the Neuro-OS workflow: Documentation & Manual.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border/40 pb-1 overflow-x-auto">
                <TabButton
                    id="overview"
                    label="System Overview"
                    icon={Map}
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                />
                <TabButton
                    id="workflow"
                    label="The Workflow (Loop)"
                    icon={GitMerge}
                    active={activeTab === "workflow"}
                    onClick={() => setActiveTab("workflow")}
                />
                <TabButton
                    id="quickstart"
                    label="Quick Start"
                    icon={Zap}
                    active={activeTab === "quickstart"}
                    onClick={() => setActiveTab("quickstart")}
                />
                <TabButton
                    id="manual"
                    label="Operations Manual"
                    icon={BookOpen}
                    active={activeTab === "manual"}
                    onClick={() => setActiveTab("manual")}
                />
            </div>

            {/* Content Area */}
            <div className="min-h-[60vh]">
                {activeTab === "overview" && <OverviewSection />}
                {activeTab === "quickstart" && <QuickstartSection />}
                {activeTab === "manual" && <ManualSection />}
                {activeTab === "workflow" && <WorkflowSection />}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon: Icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

// ------------------------------------------------------------------
// 1. SYSTEM OVERVIEW
// ------------------------------------------------------------------
function OverviewSection() {
    const modules = [
        { name: "BRYAN (Brain)", desc: "The Strategist. Identity Core & Long-term Vision.", color: "text-cyan-400" },
        { name: "DARWIN (Input)", desc: "The Scout. Trend Radar, Outliers & Viral Discovery.", color: "text-blue-500" },
        { name: "CREA (Factory)", desc: "The Artist. Scripting, Storytelling & Emotion.", color: "text-pink-500" },
        { name: "OMEGA (Output)", desc: "The Finisher. Packaging, CTR Prediction & Deployment.", color: "text-purple-500" },
        { name: "IRIS (Loop)", desc: "The Analyst. Data Mirror, Feedback & Optimization.", color: "text-green-400" },
        { name: "KNOX (Support)", desc: "The Librarian. Knowledge Base & Documentation.", color: "text-amber-500" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border/40 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <h3 className="text-2xl font-bold mb-4">The Neuro-Code Philosophy</h3>
                <p className="max-w-3xl text-lg text-muted-foreground leading-relaxed">
                    This system implements the <strong>Biological Iterative Loop</strong> to automate viral success.
                    It moves beyond simple "script writing" to a full cognitive architecture:
                    <br /><br />
                    <em>Sense (Scanner) &rarr; Distill (Wisdom) &rarr; Plan (Blueprint) &rarr; Act (Script) &rarr; Measure (Analyst).</em>
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((m) => (
                    <div key={m.name} className="p-6 bg-muted/10 border border-border/20 rounded-lg hover:border-primary/30 transition-colors group">
                        <h4 className={`font-bold group-hover:opacity-80 mb-2 ${m.color}`}>{m.name}</h4>
                        <p className="text-sm text-muted-foreground">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 2. QUICK START (SETUP)
// ------------------------------------------------------------------
function QuickstartSection() {
    const steps = [
        {
            title: "1. Google Cloud Vault (Storage)",
            desc: "To save files (Scripts & Images), you need a GCS Bucket.",
            details: [
                "Go to Google Cloud Console > Storage > Interoperability.",
                "Create 'User Account HMAC Keys' (Start with GOOG...).",
                "Create a Bucket (e.g., 'neuro-code-vault').",
                "Enter these in Settings > S3 Configuration."
            ]
        },
        {
            title: "2. YouTube Intelligence (Scanner)",
            desc: "To find viral trends, you need a Data API Key.",
            details: [
                "Go to Google Cloud Console > APIs & Services > Credentials.",
                "Create an API Key.",
                "Enter it in .env.local as YOUTUBE_API_KEY."
            ]
        },
        {
            title: "3. Channel Access (Analyst)",
            desc: "To analyze YOUR channel data (Data Mirror).",
            details: [
                "Create an OAuth 2.0 Client ID (Web Application).",
                "Add 'http://localhost:3000/settings/callback' to Authorized Redirect URIs.",
                "Copy Client ID & Secret to Settings > Google OAuth."
            ]
        }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    System Initialization
                </h3>
                <p className="text-muted-foreground mt-2">
                    Connect the Neural Network to the outside world.
                </p>
            </div>

            <div className="space-y-6">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 mt-1">
                            {i + 1}
                        </div>
                        <div className="bg-card border border-border/40 p-6 rounded-lg flex-1">
                            <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                            <p className="text-muted-foreground mb-4">{step.desc}</p>
                            <div className="bg-muted/30 p-4 rounded text-sm text-foreground/80 font-mono">
                                <ul className="list-disc pl-5 space-y-1">
                                    {step.details.map((d, k) => <li key={k}>{d}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 3. OPERATIONS MANUAL (MODULES)
// ------------------------------------------------------------------
function ManualSection() {
    return (
        <div className="prose prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* SCANNER */}
            {/* SCANNER */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <Map className="w-6 h-6" /> Scanner (Darwin)
                </h3>
                <div className="bg-muted/10 p-6 rounded-xl border border-border/40">
                    <p>The <strong>Trend Radar</strong> identifies "Outliers"—videos that perform 2-10x better than the channel average.</p>
                    <ul className="text-sm space-y-2 mt-4">
                        <li><strong>Input:</strong> Enter a niche keyword (e.g., "Neuroscience", "Productivity").</li>
                        <li><strong>Filter:</strong> Set "Max Subs" to 100k to find hidden gems, not just celebrities.</li>
                        <li><strong>Extraction:</strong> Analyze any video to extract timeless wisdom (Laws, Growth Strategy, or Facts).</li>
                        <li><strong>Nugget Selection:</strong> After extraction, click on individual nuggets (turn them colorful) to select what you want to save. Grayed-out nuggets are discarded.</li>
                    </ul>
                </div>
            </div>

            {/* WISDOM HUB */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-purple-500 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6" /> Wisdom Hub (Bryan)
                </h3>
                <div className="bg-muted/10 p-6 rounded-xl border border-border/40">
                    <p>The centralized knowledge base. It is divided into 3 Pillars:</p>
                    <div className="grid grid-cols-3 gap-4 my-4">
                        <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20">
                            <strong>1. AXIOMS (Law)</strong><br /><span className="text-xs">Universal Truths & Psychology.</span>
                        </div>
                        <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                            <strong>2. GROWTH (Meta)</strong><br /><span className="text-xs">Channel Strategy & Algorithm.</span>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                            <strong>3. RESEARCH (Fact)</strong><br /><span className="text-xs">Raw Data & Citations.</span>
                        </div>
                    </div>
                    <ul className="text-sm space-y-2 mt-4">
                        <li><strong>Edit (Single):</strong> Select one nugget and click "Edit" to refine its core principle or explanation.</li>
                        <li><strong>Combine (Multi):</strong> Select multiple insights and click "Compare & Merge" to synthesize a Master Principle.</li>
                        <li><strong>Export DOCX:</strong> Select nuggets and click "DOCX" to download a formatted report for external use.</li>
                    </ul>
                </div>
            </div>

            {/* VAULT */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <Database className="w-6 h-6" /> Cloud Vault
                </h3>
                <div className="bg-muted/10 p-6 rounded-xl border border-border/40">
                    <p>Your secure asset store (Google Cloud). Unlike local files, these persist forever.</p>
                    <ul className="text-sm mt-2">
                        <li><strong>Auto-Save:</strong> Scripts and Images generated in the Factory can be saved with one click.</li>
                        <li><strong>Access:</strong> View, download, or drag-and-drop new files directly in the Vault UI.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 4. WORKFLOW (THE GOLDEN LOOP)
// ------------------------------------------------------------------
function WorkflowSection() {
    const loop = [
        {
            phase: "1. SENSE",
            module: "Scanner",
            action: "Find an Outlier Video with High V/S Score (>3.0).",
            outcome: "Validated Topic Idea"
        },
        {
            phase: "2. DISTILL",
            module: "Wisdom",
            action: "Extract the 'Universal Law' from that video. Save to 'AXIOMS'.",
            outcome: "Core Principle"
        },
        {
            phase: "3. PLAN",
            module: "Blueprint",
            action: "Generate a new Title/Hook strategy based on that Principle.",
            outcome: "Strategic Blueprint"
        },
        {
            phase: "4. ACT",
            module: "Script Forge",
            action: "Write the script. Use 'Retention Architect' to visualize pacing.",
            outcome: "Production-Ready Script"
        },
        {
            phase: "5. SIMULATE",
            module: "Oracle",
            action: "Run 'Predict Performance'. If CTR < 5%, rewrite Title.",
            outcome: "Confidence Score"
        },
        {
            phase: "6. DEPLOY",
            module: "Vault",
            action: "Save Script & Assets to Cloud. Upload to YouTube.",
            outcome: "Published Video"
        },
        {
            phase: "7. EVOLVE",
            module: "Analyst",
            action: "Check 'Data Mirror' after 24h. Compare actuals vs. Oracle.",
            outcome: "New Wisdom (Loop closes)"
        }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-8 text-center">
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                    The Golden Loop
                </h3>
                <p className="text-lg text-muted-foreground">
                    The optimal path from "Idea" to "Legend".
                </p>
            </div>

            <div className="relative border-l-2 border-primary/30 ml-8 space-y-12 py-8">
                {loop.map((step, i) => (
                    <div key={i} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" />

                        <div className="bg-card border border-border/40 rounded-xl p-6 hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{step.phase}</span>
                                <span className={`text-xs px-2 py-1 rounded font-bold bg-primary/10 text-primary`}>{step.module}</span>
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-foreground">{step.action}</h4>
                            <div className="flex items-center gap-2 text-sm text-green-400">
                                <ArrowRight className="w-4 h-4" />
                                <strong>Outcome:</strong> {step.outcome}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
