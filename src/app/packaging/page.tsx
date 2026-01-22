"use client";

import { useState } from "react";
import { Zap, Rocket, AlertTriangle, CheckCircle2, RefreshCw, Package } from "lucide-react";
import { optimizeTitleAction } from "@/app/actions";
import { OptimizationResult } from "@/lib/gemini";
import { motion } from "framer-motion";

export default function Optimizer() {
    const [inputTitle, setInputTitle] = useState("");
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOptimize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputTitle.trim()) return;

        setLoading(true);
        setResult(null);
        try {
            const data = await optimizeTitleAction(inputTitle);
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Package className="w-8 h-8 text-primary" />
                    Launch Control
                </h2>
                <p className="text-muted-foreground mt-2">
                    Optimize titles, thumbnails, and SEO before publishing.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg">
                <form onSubmit={handleOptimize} className="flex flex-col gap-4">
                    <label className="text-sm font-medium text-foreground">Draft Title</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={inputTitle}
                            onChange={(e) => setInputTitle(e.target.value)}
                            placeholder="e.g. How to Focus Better..."
                            className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputTitle}
                            className="bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                            Optimize
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Analysis Card */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-card border border-border/40 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10 text-center">
                                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Viral Score</span>
                                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-4 bg-primary/10">
                                    <span className="text-4xl font-bold text-primary">{result.score}</span>
                                </div>
                                <p className="text-sm text-foreground/80 italic">"{result.analysis}"</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Optimized Variations
                            </h3>

                            {result.variations.map((v, i) => (
                                <div key={i} className="bg-muted/20 border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-medium text-foreground">{v.title}</h4>
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                                            Score: {v.score}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                        {v.reasoning}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
