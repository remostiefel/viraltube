"use client";

import { useState } from "react";
import { Music, Mic2, Activity, PlayCircle, Copy, Check } from "lucide-react";
import { generateAudioPromptsAction } from "@/app/actions";
import { AudioPrompt } from "@/lib/openai";
import { motion, AnimatePresence } from "framer-motion";

export default function Sonic() {
    const [contextInput, setContextInput] = useState("");
    const [result, setResult] = useState<AudioPrompt | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contextInput.trim() || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const data = await generateAudioPromptsAction(contextInput);
            setResult(data);
        } catch (error) {
            console.error("Audio Gen Error", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedIndex(id);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Music className="w-8 h-8 text-primary" />
                    Sonic Lab
                </h2>
                <p className="text-muted-foreground mt-2">
                    Design soundscapes and voiceover pacing for Suno/Udio/ElevenLabs.
                </p>
            </div>

            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg">
                <form onSubmit={handleGenerate} className="flex gap-4">
                    <input
                        type="text"
                        value={contextInput}
                        onChange={(e) => setContextInput(e.target.value)}
                        placeholder="Describe script mood (e.g. Intense scientific breakthrough with rising tension)..."
                        className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !contextInput}
                        className="bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading ? <Activity className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                        Generate Audio Layer
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            {/* Mood Header */}
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-xl border-l-4 border-primary">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Detected Frequency</span>
                                <h3 className="text-xl font-bold text-foreground mt-1">{result.mood}</h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Suno AI Card */}
                                <div className="bg-card/50 border border-border/40 rounded-xl p-6 hover:border-primary/40 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition-transform">
                                            <Music className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(result.suno, "suno")}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {copiedIndex === "suno" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Suno AI</h4>
                                    <p className="text-sm text-muted-foreground h-24 overflow-y-auto">{result.suno}</p>
                                </div>

                                {/* Udio Card */}
                                <div className="bg-card/50 border border-border/40 rounded-xl p-6 hover:border-primary/40 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(result.udio, "udio")}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {copiedIndex === "udio" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Udio</h4>
                                    <p className="text-sm text-muted-foreground h-24 overflow-y-auto">{result.udio}</p>
                                </div>

                                {/* ElevenLabs Card */}
                                <div className="bg-card/50 border border-border/40 rounded-xl p-6 hover:border-primary/40 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                                            <Mic2 className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(result.voiceover, "eleven")}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {copiedIndex === "eleven" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Voiceover Direction</h4>
                                    <p className="text-sm text-muted-foreground h-24 overflow-y-auto">{result.voiceover}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
