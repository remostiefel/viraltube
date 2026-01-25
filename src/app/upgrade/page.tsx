"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ShieldCheck, Zap, Lock, Unlock, ArrowRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassBrain from "@/components/dashboard/GlassBrain";
import { StrategyProfile } from "@/lib/gemini";

const PROTOCOL_STEPS = [
    { id: 1, category: "Biological", label: "Hydration Check (500ml Water + Electrolytes)" },
    { id: 2, category: "Biological", label: "Light Exposure (View Sky/Lux Lamp for 2m)" },
    { id: 3, category: "Biological", label: "Breathwork (30 Physiological Sighs)" },
    { id: 4, category: "Biological", label: "Caffeine Timing (90m Post-Wake Checked)" },
    { id: 5, category: "Environment", label: "Phone in Airplane Mode / Separate Room" },
    { id: 6, category: "Environment", label: "Workspace Clear (Visual Noise Reduced)" },
    { id: 7, category: "Environment", label: "Binaural Beats / 40Hz Audio Ready" },
    { id: 8, category: "Mental", label: "Review 'Mission Statement' (Why this Video?)" },
    { id: 9, category: "Mental", label: "Visualize End State (Completed Project)" },
    { id: 10, category: "Mental", label: "Set Timer (90min Ultradian Cycle)" },
];

const SECRET_CODE = "GAMMA";

export default function UpgradePage() {
    const router = useRouter();
    const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
    const [code, setCode] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);

    useEffect(() => {
        const savedProfile = localStorage.getItem("nc_cortex_profile");
        if (savedProfile) {
            setCortexProfile(JSON.parse(savedProfile));
        }
    }, []);

    const toggleStep = (id: number) => {
        setCheckedSteps(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const progress = (checkedSteps.length / PROTOCOL_STEPS.length) * 100;

    const handleUnlock = () => {
        if (code.toUpperCase() === SECRET_CODE) {
            setUnlocked(true);
            // Confetti or Sound could go here

            // Update Profile Status mock
            if (cortexProfile) {
                // In a real app, this would be a server action
                // For now, we simulate "Prime State" in local storage logic (Dashboard reads this)
                // We'll trigger a visual update via local storage event or just rely on router refresh
            }
        } else {
            alert("ACCESS DENIED. INCORRECT PROTOCOL CODE.");
            setCode("");
        }
    };

    const finishUpgrade = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("nc_system_state", "OPTIMIZED");
        }
        router.push("/");
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/20 pb-6">
                <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
                    <Zap className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        THE UPGRADE
                        {unlocked && <span className="bg-teal-500 text-black text-xs font-bold px-2 py-0.5 rounded">ACCESS GRANTED</span>}
                    </h1>
                    <p className="text-muted-foreground">Neuro-Biological Priming Protocol (15 min)</p>
                </div>
                <div className="ml-auto flex flex-col items-end">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Protocol Status</span>
                    <span className={cn("text-xl font-mono font-bold", progress === 100 ? "text-teal-400" : "text-slate-500")}>
                        {Math.round(progress)}% COMPLETE
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* LEFT: Checklist */}
                <div className="space-y-6">
                    <div className="bg-card/30 border border-border/40 rounded-2xl p-6 relative overflow-hidden">
                        {/* Progress Bar background */}
                        <div className="absolute top-0 left-0 h-1 bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />

                        <div className="space-y-4">
                            {PROTOCOL_STEPS.map((step) => {
                                const isChecked = checkedSteps.includes(step.id);
                                return (
                                    <div
                                        key={step.id}
                                        onClick={() => toggleStep(step.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border",
                                            isChecked
                                                ? "bg-teal-500/10 border-teal-500/30 shadow-[0_0_15px_-5px_rgba(45,212,191,0.2)]"
                                                : "bg-background/20 border-transparent hover:bg-background/40 hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
                                            isChecked ? "bg-teal-500 border-teal-500 text-black" : "border-slate-600 text-transparent"
                                        )}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{step.label}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{step.category}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Visual & Unlock */}
                <div className="space-y-6 lg:sticky lg:top-8">
                    {/* Visualizer Reuse - show ACTIVE only when unlocked or near complete */}
                    <GlassBrain state={unlocked ? "OPTIMIZED" : (progress > 50 ? "ACTIVE" : "IDLE")} />

                    {/* Gamification / Unlock Section */}
                    <div className="bg-black/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm">

                        {!unlocked ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                    <Lock className="w-5 h-5" />
                                    <h3 className="font-bold text-sm uppercase tracking-widest">System Locked</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Complete the protocol to obtain the daily access code.
                                    <br />
                                    <span className="text-xs opacity-50">(Hint: It involves Gamma Waves)</span>
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="ENTER ACCESS CODE"
                                        className="bg-black/50 border border-border/50 rounded-lg px-4 py-2 font-mono text-center uppercase tracking-[0.2em] focus:outline-none focus:border-teal-500/50 w-full"
                                    />
                                    <button
                                        onClick={handleUnlock}
                                        disabled={progress < 100}
                                        className="bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(45,212,191,0.5)]">
                                    <Unlock className="w-8 h-8 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">SYSTEM UPGRADED</h3>
                                    <p className="text-teal-400 text-sm font-mono uppercase tracking-widest">
                                        Neuro-Plasticity State: PRIMED
                                    </p>
                                </div>
                                <button
                                    onClick={finishUpgrade}
                                    className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] flex items-center justify-center gap-2"
                                >
                                    <Brain className="w-5 h-5" />
                                    ENTER NEURO-CODE OS
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-200/60 leading-relaxed">
                        <span className="font-bold text-blue-400 block mb-1">SCIENCE NOTE:</span>
                        This protocol leverages "Behavioral Activation" and "Ultradian Rhythms" to maximize dopamine synthesis for the next 90 minutes of Deep Work.
                    </div>
                </div>

            </div>
        </div>
    );
}
