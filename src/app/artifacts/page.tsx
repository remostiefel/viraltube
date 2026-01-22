"use client";

import { useState } from "react";
import { FileText, Download, Printer, CheckCircle2 } from "lucide-react";
import { generateProtocolPDF } from "@/lib/pdf";
import { motion } from "framer-motion";

export default function Artifacts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!title || !content) return;

        setIsGenerating(true);

        // Simulate a brief "processing" delay for UX
        setTimeout(() => {
            generateProtocolPDF(title, content);
            setLastGenerated(new Date().toLocaleTimeString());
            setIsGenerating(false);
        }, 1000);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    The Archives
                </h2>
                <p className="text-muted-foreground mt-2">
                    Convert your scripts into high-value "Protocol Checklists" for your audience.
                </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Editor Column */}
                <div className="md:col-span-8 space-y-6">
                    <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Document Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Dopamine Reset Protocol"
                                className="w-full bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Protocol Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste your script or protocol steps here..."
                                className="w-full h-[400px] bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Column */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-card border border-border/40 rounded-xl p-6 space-y-6 sticky top-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Printer className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">PDF Generator</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Transforms text into a branded "Neuro-Code" PDF checklist.
                            </p>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!title || !content || isGenerating}
                            className="w-full bg-primary text-background font-bold px-6 py-4 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isGenerating ? "Processing..." : (
                                <>
                                    <Download className="w-5 h-5" /> Generate PDF
                                </>
                            )}
                        </button>

                        {lastGenerated && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-green-500">Download Ready</p>
                                    <p className="text-xs text-muted-foreground">Generated at {lastGenerated}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
