"use client";

import { useState, useEffect } from "react";
import { Brain, Compass, Sliders, Zap, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StrategyProfile } from "@/lib/gemini";

const DEFAULT_PROFILE: StrategyProfile = {
    niche: "Biohacking & Neuroscience",
    language: "DE",
    tone: "balanced",
    emulationMode: "adapt",
    contentDepth: 70
};

export default function Cortex() {
    const [profile, setProfile] = useState<StrategyProfile>(DEFAULT_PROFILE);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("nc_cortex_profile");
        if (stored) {
            setProfile(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("nc_cortex_profile", JSON.stringify(profile));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Brain className="w-8 h-8 text-primary" />
                        Identity Core
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Calibrate the strategic compass for your AI agents.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className={cn(
                        "px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all",
                        saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? "Calibrated" : "Save Strategy"}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Compass / Header Card */}
                <div className="col-span-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="bg-background/20 p-4 rounded-full border-2 border-indigo-400/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <Compass className="w-16 h-16 text-indigo-300" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Current Alignment</h3>
                        <p className="text-indigo-200">
                            Your AI is currently optimizing for <span className="text-white font-bold">{profile.language === "DE" ? "German" : "English"}</span> audiences
                            in the <span className="text-white font-bold">{profile.niche}</span> niche.
                            The tone is calibrated to <span className="text-white font-bold uppercase">{profile.tone}</span>.
                        </p>
                    </div>
                </div>

                {/* Core Settings */}
                <div className="bg-card border border-border/40 rounded-xl p-6 space-y-6">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Sliders className="w-5 h-5 text-primary" /> Core Parameters
                    </h3>

                    <div className="space-y-3">
                        <label className="text-sm font-medium">Target Language</label>
                        <div className="flex bg-muted/30 p-1 rounded-lg">
                            {(["DE", "EN"] as const).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setProfile({ ...profile, language: lang })}
                                    className={cn(
                                        "flex-1 py-2 rounded-md text-sm font-bold transition-all",
                                        profile.language === lang ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {lang === "DE" ? "🇩🇪 German (DACH)" : "🇺🇸 English (Global)"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium">Content Strategy</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["translate", "adapt", "innovate"] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setProfile({ ...profile, emulationMode: mode })}
                                    className={cn(
                                        "py-2 px-2 rounded-md text-xs font-bold transition-all border",
                                        profile.emulationMode === mode
                                            ? "bg-purple-600/20 border-purple-600 text-purple-400"
                                            : "bg-muted/20 border-transparent text-muted-foreground hover:border-border"
                                    )}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {profile.emulationMode === "translate" && "Direct Translation of successful concepts."}
                            {profile.emulationMode === "adapt" && "Cultural adaptation (same core, new framing)."}
                            {profile.emulationMode === "innovate" && "Use unique angles inspired by the source."}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium">Niche Definition</label>
                        <input
                            type="text"
                            value={profile.niche}
                            onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
                            className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                </div>

                {/* Tone Calibration */}
                <div className="bg-card border border-border/40 rounded-xl p-6 space-y-6">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-yellow-500" /> Tonal Calibration
                    </h3>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex justify-between">
                            <span>Hype vs. Substance</span>
                            <span className="text-primary font-mono">{profile.tone.toUpperCase()}</span>
                        </label>
                        <div className="flex bg-muted/30 p-1 rounded-lg">
                            {(["hype", "balanced", "substance"] as const).map(tone => (
                                <button
                                    key={tone}
                                    onClick={() => setProfile({ ...profile, tone: tone })}
                                    className={cn(
                                        "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                                        profile.tone === tone ? "bg-yellow-500 text-black shadow-sm" : "hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {profile.tone === "hype" && "MrBeast Style: Fast cuts, high emotion, broad appeal."}
                            {profile.tone === "balanced" && "Hybrid: Engaging hook + solid value (Modern Wisdom style)."}
                            {profile.tone === "substance" && "Huberman Style: Deep, slow, authoritative, data-heavy."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex justify-between">
                            <span>Content Depth</span>
                            <span className="text-primary font-mono">{profile.contentDepth}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={profile.contentDepth}
                            onChange={(e) => setProfile({ ...profile, contentDepth: parseInt(e.target.value) })}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Snackable (Shorts)</span>
                            <span>Deep Dive (Longform)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
