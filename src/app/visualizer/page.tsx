"use client";

import { useState, useEffect } from "react";
import { Image, Layers, Sparkles, Copy, Check, Palette, CloudUpload, Loader2 } from "lucide-react";
import { generateImagePromptsAction, generateImageAction, saveAssetToVaultAction } from "@/app/actions";
import { ImagePrompt } from "@/lib/openai";
import { S3Config } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

export default function Visualizer() {
    const [sceneInput, setSceneInput] = useState("");
    const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    // Image Generation State
    const [generatingImage, setGeneratingImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

    // Vault State
    const [savingToVault, setSavingToVault] = useState<string | null>(null);
    const [config, setConfig] = useState<S3Config | null>(null);

    useEffect(() => {
        const endpoint = localStorage.getItem("nc_s3_endpoint") || process.env.NEXT_PUBLIC_S3_ENDPOINT;
        const region = localStorage.getItem("nc_s3_region") || process.env.NEXT_PUBLIC_S3_REGION || "auto";
        const accessKeyId = localStorage.getItem("nc_s3_access_key") || process.env.NEXT_PUBLIC_S3_ACCESS_KEY;
        const secretAccessKey = localStorage.getItem("nc_s3_secret_key") || process.env.NEXT_PUBLIC_S3_SECRET_KEY;
        const bucket = localStorage.getItem("nc_s3_bucket") || process.env.NEXT_PUBLIC_S3_BUCKET;
        if (bucket && accessKeyId && secretAccessKey) {
            setConfig({ endpoint: endpoint || undefined, region: region || "auto", accessKeyId, secretAccessKey, bucket });
        }
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sceneInput.trim() || loading) return;

        setLoading(true);
        setPrompts([]);
        setGeneratedImages({});

        try {
            const data = await generateImagePromptsAction(sceneInput);
            setPrompts(data);
        } catch (error) {
            console.error("Prompt Gen Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRealImage = async (prompt: string, id: string) => {
        if (generatingImage) return;
        setGeneratingImage(id);
        try {
            const url = await generateImageAction(prompt);
            if (url) {
                setGeneratedImages(prev => ({ ...prev, [id]: url }));
            } else {
                alert("Image Generation Failed. Check Server Logs.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingImage(null);
        }
    };

    const handleSaveToVault = async (url: string, id: string, scene: string) => {
        if (!config || savingToVault) return;
        setSavingToVault(id);
        try {
            const result = await saveAssetToVaultAction(config, url, "image", scene);
            if (result) {
                alert(`Saved to Vault: ${result}`);
            } else {
                alert("Failed to save to Vault.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingToVault(null);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(id);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Image className="w-8 h-8 text-primary" />
                    Pixel Foundry
                </h2>
                <p className="text-muted-foreground mt-2">
                    Generate cinematic prompts and visualize concepts with DALL-E 3.
                </p>
            </div>

            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg">
                <form onSubmit={handleGenerate} className="flex gap-4">
                    <input
                        type="text"
                        value={sceneInput}
                        onChange={(e) => setSceneInput(e.target.value)}
                        placeholder="Describe a scene (e.g. A futuristic lab with holographic screens)..."
                        className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !sceneInput}
                        className="bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                        Generate Prompts
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                    {prompts.map((prompt, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-card/50 border border-border/40 rounded-xl overflow-hidden"
                        >
                            <div className="bg-muted/10 p-4 border-b border-border/20">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Concept {idx + 1}</span>
                                <p className="text-foreground font-medium mt-1">{prompt.scene}</p>
                            </div>

                            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/20">
                                {/* Midjourney Column */}
                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs font-bold tracking-wider">Midjourney v6</span>
                                        <button
                                            onClick={() => copyToClipboard(prompt.midjourney, `mj-${idx}`)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {copiedIndex === `mj-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-lg border border-border/10">
                                        <p className="text-sm font-mono text-muted-foreground break-words">{prompt.midjourney}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground italic mt-2">
                                        *Midjourney generation is currently manual only.
                                    </div>
                                </div>

                                {/* DALL-E Column */}
                                <div className="p-6 space-y-3 flex flex-col h-full">
                                    <div className="flex justify-between items-center">
                                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold tracking-wider">DALL-E 3</span>
                                        <button
                                            onClick={() => copyToClipboard(prompt.dalle, `de-${idx}`)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {copiedIndex === `de-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-lg border border-border/10">
                                        <p className="text-sm font-mono text-muted-foreground break-words">{prompt.dalle}</p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border/10">
                                        {generatedImages[`de-${idx}`] ? (
                                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                                <img
                                                    src={generatedImages[`de-${idx}`]}
                                                    alt="Generated"
                                                    className="w-full rounded-lg shadow-md border border-border/20"
                                                />
                                                {config ? (
                                                    <button
                                                        onClick={() => handleSaveToVault(generatedImages[`de-${idx}`], `de-${idx}`, prompt.scene)}
                                                        disabled={savingToVault === `de-${idx}`}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingToVault === `de-${idx}` ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CloudUpload className="w-4 h-4" /> Save to Cloud Vault
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="text-xs text-center text-muted-foreground bg-muted/30 p-2 rounded">
                                                        Vault not configured. Cannot save.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateRealImage(prompt.dalle, `de-${idx}`)}
                                                disabled={generatingImage === `de-${idx}`}
                                                className="w-full text-sm bg-muted hover:bg-muted/80 text-foreground font-medium py-2 rounded-lg transition-colors border border-border/50 flex items-center justify-center gap-2"
                                            >
                                                {generatingImage === `de-${idx}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                                                Render with DALL-E 3
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
