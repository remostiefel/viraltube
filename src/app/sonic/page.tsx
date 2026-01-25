"use client";

import { useState } from "react";
import { Music, Mic2, Activity, PlayCircle, Copy, Check, Save } from "lucide-react";
import { generateAudioPromptsAction, generateSpeechAction } from "@/app/actions";
import { AudioPrompt } from "@/lib/openai";
import { motion, AnimatePresence } from "framer-motion";

export default function Sonic() {
    // Prompt Generator State
    const [promptInput, setPromptInput] = useState("");
    const [promptResult, setPromptResult] = useState<AudioPrompt | null>(null);
    const [promptLoading, setPromptLoading] = useState(false);

    // Voice Forge State
    const [voiceText, setVoiceText] = useState("");
    const [voiceLoading, setVoiceLoading] = useState(false);
    const [voice, setVoice] = useState("en-US-Journey-F");
    const [speed, setSpeed] = useState(1.0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    const handleGeneratePrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptInput.trim() || promptLoading) return;

        setPromptLoading(true);
        setPromptResult(null);

        try {
            const data = await generateAudioPromptsAction(promptInput);
            setPromptResult(data);
        } catch (error) {
            console.error("Audio Gen Error", error);
        } finally {
            setPromptLoading(false);
        }
    };

    const handleSynthesize = async () => {
        if (!voiceText.trim() || voiceLoading) return;
        setVoiceLoading(true);
        setAudioUrl(null);

        try {
            const audioBase64 = await generateSpeechAction(voiceText, voice, speed);
            if (audioBase64) {
                const url = `data:audio/mp3;base64,${audioBase64}`;
                setAudioUrl(url);
                const audio = new Audio(url);
                audio.play();
            }
        } catch (error) {
            console.error("Synthesis Error", error);
        } finally {
            setVoiceLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedIndex(id);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Music className="w-8 h-8 text-primary" />
                    Sonic Lab
                </h2>
                <p className="text-muted-foreground mt-2">
                    Design soundscapes and synthesize high-fidelity voiceovers using Gemini.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">

                {/* LEFT: VOICE FORGE */}
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Mic2 className="w-5 h-5 text-cyan-400" />
                            Voice Forge
                        </h3>
                        <span className="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-1 rounded">GOOGLE JOURNEY</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <textarea
                            value={voiceText}
                            onChange={(e) => setVoiceText(e.target.value)}
                            placeholder="Enter your script here to synthesize..."
                            className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm leading-relaxed"
                        />

                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Persona</label>
                                <select
                                    value={voice}
                                    onChange={(e) => setVoice(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500"
                                >
                                    <option value="Algieba">Algieba (User Preferred)</option>
                                    <option value="en-US-Journey-F">Puck (Journey F)</option>
                                    <option value="en-US-Journey-D">Fenrir (Journey D)</option>
                                    <option value="en-US-Journey-O">Kore (Journey O)</option>
                                    <option value="en-US-Standard-C">Standard Female (US)</option>
                                    <option value="en-US-Standard-D">Standard Male (US)</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Speed ({speed}x)</label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2.0"
                                        step="0.1"
                                        value={speed}
                                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                        className="w-full accent-cyan-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Temperature (1.55)</label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.0"
                                        max="2.0"
                                        step="0.05"
                                        defaultValue="1.55"
                                        disabled
                                        className="w-full accent-cyan-500 opacity-50 cursor-not-allowed"
                                        title="Fixed to 1.55 per settings"
                                    />
                                </div>
                            </div>
                        </div>

                        {audioUrl && (
                            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 flex items-center gap-4">
                                <audio controls src={audioUrl} className="w-full h-8" />
                                <a href={audioUrl} download={`voice-forge-${Date.now()}.mp3`} className="p-2 hover:bg-cyan-500/10 rounded-full text-cyan-400">
                                    <Save className="w-4 h-4" />
                                </a>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                // Simple wrapper to pass standard args + new temp
                                const doSynthesis = async () => {
                                    if (!voiceText.trim() || voiceLoading) return;
                                    setVoiceLoading(true);
                                    setAudioUrl(null);
                                    try {
                                        const audioBase64 = await generateSpeechAction(voiceText, voice, speed, 1.55);
                                        if (audioBase64) {
                                            const url = `data:audio/mp3;base64,${audioBase64}`;
                                            setAudioUrl(url);
                                            const audio = new Audio(url);
                                            audio.play();
                                        }
                                    } catch (error) {
                                        console.error("Synthesis Error", error);
                                    } finally {
                                        setVoiceLoading(false);
                                    }
                                };
                                doSynthesis();
                            }}
                            disabled={voiceLoading || !voiceText}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-6 py-4 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                        >
                            {voiceLoading ? <Activity className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5 fill-current" />}
                            Synthesize Voice
                        </button>
                    </div>
                </div>


                {/* RIGHT: PROMPT GENERATOR */}
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Music className="w-5 h-5 text-purple-400" />
                            Audio Architect
                        </h3>
                        <span className="text-xs font-mono bg-purple-950 text-purple-400 px-2 py-1 rounded">PROMPT GEN</span>
                    </div>

                    <div className="flex flex-col gap-4 overflow-hidden h-full">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promptInput}
                                onChange={(e) => setPromptInput(e.target.value)}
                                placeholder="Describe mood (e.g. Dark industrial techno built for tension)..."
                                className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                            <button
                                onClick={handleGeneratePrompt}
                                disabled={promptLoading || !promptInput}
                                className="bg-purple-600/20 text-purple-400 border border-purple-500/50 font-bold px-4 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 transition-colors"
                            >
                                {promptLoading ? <Activity className="w-5 h-5 animate-spin" /> : "Generate"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            <AnimatePresence>
                                {promptResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        {/* Mood Header */}
                                        <div className="bg-purple-500/5 p-3 rounded-lg border-l-2 border-purple-500">
                                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Analysis</span>
                                            <p className="text-sm font-medium text-foreground">{promptResult.mood}</p>
                                        </div>

                                        {/* Prompt Cards */}
                                        {[
                                            { label: "Suno AI", text: promptResult.suno, icon: Music, color: "text-purple-400", id: "suno" },
                                            { label: "Udio", text: promptResult.udio, icon: Activity, color: "text-emerald-400", id: "udio" },
                                            { label: "Voice Direction", text: promptResult.voiceover, icon: Mic2, color: "text-blue-400", id: "eleven" },
                                        ].map((item) => (
                                            <div key={item.id} className="bg-card/50 border border-border/40 rounded-lg p-4 hover:border-sidebar-primary/40 transition-colors group relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className={`w-4 h-4 ${item.color}`} />
                                                        <h4 className="text-sm font-bold">{item.label}</h4>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(item.text, item.id)}
                                                        className="text-muted-foreground hover:text-foreground p-1"
                                                    >
                                                        {copiedIndex === item.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!promptResult && !promptLoading && (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 space-y-2">
                                    <Music className="w-12 h-12" />
                                    <p className="text-sm">Ready to architect sound.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
