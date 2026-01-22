"use client";

import { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { predictPerformanceAction } from "@/app/actions";
import { OraclePrediction } from "@/lib/oracle";
import { OracleCard } from "@/components/analysis/OracleCard";

export default function OraclePage() {
    const [title, setTitle] = useState("");
    const [script, setScript] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<OraclePrediction | null>(null);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !script || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const data = await predictPerformanceAction(title, script, thumbnail || "Not specified");
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4 border-b border-border/40 pb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">The Oracle</h1>
                    <p className="text-purple-300">Audience Simulation & Performance Prediction Engine</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* INPUT FORM */}
                <div className="bg-card/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
                    <form onSubmit={handlePredict} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Video Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-border/40 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                placeholder="e.g. I stopped drinking coffee for 30 days..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Thumbnail Concept (Optional)</label>
                            <input
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                                className="w-full bg-black/40 border border-border/40 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                placeholder="Describe the visual hook..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Script / Content</label>
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="w-full h-64 bg-black/40 border border-border/40 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none transition-all font-mono text-sm leading-relaxed"
                                placeholder="Paste your script or outline here for analysis..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !title || !script}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Run Simulation
                        </button>
                    </form>
                </div>

                {/* RESULTS */}
                <div className="relative">
                    {!result && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 space-y-4 border-2 border-dashed border-white/5 rounded-xl p-12">
                            <Sparkles className="w-16 h-16" />
                            <p className="text-center font-mono text-sm max-w-xs">
                                Awaiting input data for audience simulation...
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center text-purple-400 space-y-4 border border-purple-500/20 bg-purple-500/5 rounded-xl p-12 animate-pulse">
                            <Loader2 className="w-12 h-12 animate-spin" />
                            <p className="text-center font-mono text-xs tracking-widest uppercase">
                                Simulating Focus Group (n=1000)...
                            </p>
                        </div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <OracleCard data={result} />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
