"use client";

import { useState } from "react";
import {
    Package,
    Wand2,
    FileText,
    Tag,
    Hash,
    Type,
    Copy,
    Check,
    RefreshCcw,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizeVideoMetadataAction } from "@/app/actions";
import { YoutubeOptimizerResult } from "@/lib/agents/youtube-optimizer";

interface SectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    loading?: boolean;
    onGenerate: () => void;
    hasContent: boolean;
}

const OutputSection = ({ title, icon: Icon, children, loading, onGenerate, hasContent }: SectionProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onGenerate}
                        disabled={loading}
                        className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
                        {hasContent ? "Regenerate" : "Generate"}
                    </button>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="p-4">
                    {children}
                </div>
            )}
        </div>
    );
};

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1.5 rounded-md transition-all",
                copied ? "bg-green-500/10 text-green-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Copy to clipboard"
        >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
    );
}

export default function PackagingPage() {
    const [script, setScript] = useState("");
    const [loading, setLoading] = useState<string | null>(null);
    const [result, setResult] = useState<YoutubeOptimizerResult>({});

    const handleOptimize = async (type: 'all' | 'filename' | 'title' | 'description' | 'tags') => {
        if (!script.trim()) return;
        setLoading(type);
        try {
            const data = await optimizeVideoMetadataAction(script, type);
            if (data) {
                if (type === 'all') {
                    setResult(data);
                } else {
                    setResult(prev => ({ ...prev, ...data }));
                }
            }
        } catch (e) {
            console.error("Optimization failed", e);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Package className="w-8 h-8 text-primary" />
                    Distribution Center
                </h2>
                <p className="text-muted-foreground mt-2">
                    Package your content for maximum viral distribution. Anti-AI optimization for Humans.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Input */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Input Script</h3>
                            <button
                                onClick={() => handleOptimize('all')}
                                disabled={!script.trim() || !!loading}
                                className="bg-gradient-to-r from-primary to-purple-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                Generate ALL
                            </button>
                        </div>
                        <textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Paste your finished video script here..."
                            className="flex-1 w-full bg-muted/30 border border-border/50 rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-primary/20 min-h-[500px]"
                        />
                    </div>
                </div>

                {/* Right Column: Outputs */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Filename */}
                    <OutputSection
                        title="Filename"
                        icon={FileText}
                        loading={loading === 'filename' || loading === 'all'}
                        onGenerate={() => handleOptimize('filename')}
                        hasContent={!!result.filename}
                    >
                        {result.filename ? (
                            <div className="space-y-4">
                                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border border-primary/20 bg-primary/5">
                                    <code className="text-primary font-bold">{result.filename.primary}</code>
                                    <CopyButton text={result.filename.primary} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Alternatives</p>
                                    {result.filename.alternatives.map((alt, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded">
                                            <span className="font-mono text-muted-foreground">{alt}</span>
                                            <CopyButton text={alt} />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                                    Why: {result.filename.reasoning}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                Ready to generate optimized filename...
                            </div>
                        )}
                    </OutputSection>

                    {/* Title */}
                    <OutputSection
                        title="Title Hook"
                        icon={Type}
                        loading={loading === 'title' || loading === 'all'}
                        onGenerate={() => handleOptimize('title')}
                        hasContent={!!result.title}
                    >
                        {result.title ? (
                            <div className="space-y-4">
                                <div className="bg-card border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)] rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className="text-xl font-bold leading-tight">{result.title.primary}</h4>
                                        <CopyButton text={result.title.primary} />
                                    </div>
                                    <div className="mt-2 text-xs text-primary/80 font-medium">
                                        Psychology: {result.title.psychology}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Alternatives</p>
                                    {result.title.alternatives.map((alt, i) => (
                                        <div key={i} className="p-3 border border-border/50 rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <span className="font-medium text-sm">{alt}</span>
                                            <CopyButton text={alt} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                Ready to generate viral titles...
                            </div>
                        )}
                    </OutputSection>

                    {/* Description */}
                    <OutputSection
                        title="Description"
                        icon={Hash}
                        loading={loading === 'description' || loading === 'all'}
                        onGenerate={() => handleOptimize('description')}
                        hasContent={!!result.description}
                    >
                        {result.description ? (
                            <div className="relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={result.description.description} />
                                </div>
                                <textarea
                                    readOnly
                                    value={result.description.description}
                                    className="w-full h-[300px] bg-muted/20 border border-border/50 rounded-lg p-4 text-sm resize-none focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                Ready to write human-like description...
                            </div>
                        )}
                    </OutputSection>


                    {/* Tags */}
                    <OutputSection
                        title="SEO Tags"
                        icon={Tag}
                        loading={loading === 'tags' || loading === 'all'}
                        onGenerate={() => handleOptimize('tags')}
                        hasContent={!!result.tags}
                    >
                        {result.tags ? (
                            <div className="space-y-4">
                                <div className="bg-muted/30 border border-border/50 rounded-lg p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                                    {result.tags.tags}
                                </div>
                                <div className="flex justify-end">
                                    <CopyButton text={result.tags.tags} />
                                </div>
                                <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                                    Strategy: {result.tags.strategy}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                Ready to generate SEO tags...
                            </div>
                        )}
                    </OutputSection>

                </div>
            </div>
        </div>
    );
}
