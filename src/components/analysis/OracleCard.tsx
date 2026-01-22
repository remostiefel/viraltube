"use client";

import { OraclePrediction } from "@/lib/oracle";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function OracleCard({ data }: { data: OraclePrediction }) {
    return (
        <div className="bg-black/40 border border-purple-500/30 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">THE ORACLE</h3>
                    <p className="text-xs text-purple-300 uppercase tracking-widest font-bold">Performance Simulation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                {/* CTR */}
                <MetricCard
                    label="Viral Potential"
                    score={data.viralScore}
                    color="text-purple-400"
                    borderColor="border-purple-500/30"
                />
                <MetricCard
                    label="Est. CTR"
                    score={data.ctrprediction.score}
                    suffix="%"
                    color="text-blue-400"
                    borderColor="border-blue-500/30"
                    subtext={data.ctrprediction.confidence}
                />
                <MetricCard
                    label="Retention Score"
                    score={data.avdprediction.score}
                    color="text-emerald-400"
                    borderColor="border-emerald-500/30"
                />
            </div>

            <div className="space-y-4 relative z-10">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" /> Risk Analysis
                    </h4>
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Drop-off Risk:</strong> {data.avdprediction.dropOffRisk}</p>
                    <p className="text-sm text-gray-400 italic">"{data.avdprediction.reasoning}"</p>
                </div>

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase px-1">Simulated Viewer Feedback</h4>
                    {data.simulatedComments.map((c, i) => (
                        <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-3 flex gap-3 items-start">
                            <div className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${c.sentiment === 'positive' ? 'bg-green-500' :
                                    c.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                                }`} />
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-0.5">{c.user}</p>
                                <p className="text-sm text-gray-200">"{c.comment}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, score, suffix = "", color, borderColor, subtext }: any) {
    return (
        <div className={`bg-card/30 border ${borderColor} rounded-lg p-4 text-center`}>
            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">{label}</div>
            <div className={`text-3xl font-black ${color}`}>
                {score}{suffix}
            </div>
            {subtext && <div className="text-xs font-mono text-gray-400 mt-1">{subtext}</div>}
        </div>
    );
}
