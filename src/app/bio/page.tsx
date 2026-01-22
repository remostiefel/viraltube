"use client";

import { Activity, Brain, Zap, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function BioMetrics() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary" />
                    Bio-Link
                </h2>
                <p className="text-muted-foreground mt-2">
                    Real-time monitoring of operator biological states.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Score */}
                <div className="md:col-span-1 bg-card border border-border/40 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <div className="relative z-10 w-48 h-48 rounded-full border-4 border-muted flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin-slow absolute" />
                        <div className="text-center">
                            <span className="text-5xl font-bold text-foreground block">87</span>
                            <span className="text-xs text-primary tracking-widest uppercase">Neuro-Score</span>
                        </div>
                    </div>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Your cognitive load is optimal. <br /> Ready for <strong>Deep Work</strong>.
                    </p>
                </div>

                {/* Detailed Stats */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MetricCard
                        label="Dopamine Baseline"
                        value="Stable"
                        subValue="12% above avg"
                        icon={Zap}
                        color="text-yellow-400"
                        bg="bg-yellow-400/10"
                        barColor="bg-yellow-400"
                        progress={70}
                    />
                    <MetricCard
                        label="Cognitive Load"
                        value="Moderate"
                        subValue="Processing..."
                        icon={Brain}
                        color="text-primary"
                        bg="bg-primary/10"
                        barColor="bg-primary"
                        progress={45}
                    />
                    <MetricCard
                        label="Recovery Status"
                        value="92%"
                        subValue="HRV: 104ms"
                        icon={Moon}
                        color="text-indigo-400"
                        bg="bg-indigo-400/10"
                        barColor="bg-indigo-400"
                        progress={92}
                    />
                    <MetricCard
                        label="Flow State Probability"
                        value="High"
                        subValue="Environment: Quiet"
                        icon={Activity}
                        color="text-emerald-400"
                        bg="bg-emerald-400/10"
                        barColor="bg-emerald-400"
                        progress={85}
                    />
                </div>
            </div>

            {/* Graph Area */}
            <div className="bg-card border border-border/40 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    Circadian Rhythm Sync
                </h3>
                <div className="h-48 flex items-end gap-2 px-2">
                    {[30, 45, 60, 80, 75, 50, 40, 60, 90, 100, 95, 70, 50, 30].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 1 }}
                            className="flex-1 bg-primary/20 hover:bg-primary/50 transition-colors rounded-t-sm relative group"
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border p-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                {h}% Activity
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, subValue, icon: Icon, color, bg, barColor, progress }: any) {
    return (
        <div className="bg-card/50 border border-border/20 rounded-xl p-5 hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
            </div>
            <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${barColor}`}
                    />
                </div>
                <span className="text-xs text-muted-foreground block text-right">{subValue}</span>
            </div>
        </div>
    )
}
