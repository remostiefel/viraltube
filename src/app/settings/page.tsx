"use client";

import { useState, useEffect } from "react";
import { Settings, Lock, Database, Key, CheckCircle, Save, Variable, Shield } from "lucide-react";

export default function SettingsPage() {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [apiKey, setApiKey] = useState(""); // General YouTube Data API Key
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setClientId(localStorage.getItem("nc_google_client_id") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "");
        setClientSecret(localStorage.getItem("nc_google_client_secret") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "");
        setApiKey(localStorage.getItem("nc_youtube_api_key") || "");
    }, []);

    const handleSave = () => {
        localStorage.setItem("nc_google_client_id", clientId);
        localStorage.setItem("nc_google_client_secret", clientSecret);
        localStorage.setItem("nc_youtube_api_key", apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    System Configuration
                </h2>
                <p className="text-muted-foreground mt-2">
                    Manage API Credentials and System Secrets.
                </p>
            </div>

            <div className="grid gap-6">

                {/* Google OAuth Config */}
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg space-y-6">
                    <div className="flex items-center gap-4 mb-4 border-b border-border/40 pb-4">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">YouTube API Credentials</h3>
                            <p className="text-sm text-muted-foreground">Required for Real-Time Analytics & Channel Monitoring.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase">Google Client ID</label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="e.g. 12345...apps.googleusercontent.com"
                                className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase">Google Client Secret</label>
                            <input
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="••••••••••••••••••••"
                                className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase">YouTube Data API Key (Public Data)</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                            />
                            <p className="text-xs text-muted-foreground">Used for Trend Scouting & Competitive Analysis (Scanner).</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${saved ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                    >
                        {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {saved ? "Configuration Saved" : "Save Changes"}
                    </button>
                </div>

                <div className="bg-muted/10 border border-border/20 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
                    <p className="font-bold flex items-center gap-2"><Shield className="w-3 h-3" /> Security Note</p>
                    <p>Credentials are stored in your browser's LocalStorage. This is suitable for a local-first application but ensures keys are not hardcoded in the codebase.</p>
                </div>

                {/* Knowledge Base Training */}
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg space-y-6">
                    <div className="flex items-center gap-4 mb-4 border-b border-border/40 pb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                            <Variable className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Knowledge Base Training</h3>
                            <p className="text-sm text-muted-foreground">Import wisdom from playlists to upgrade your AI Team's context.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Paste Playlist URL to Learn From (e.g. Tips & Tricks Playlist)..."
                            className="flex-1 bg-muted/30 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            id="training-input"
                        />
                        <button
                            onClick={async () => {
                                const input = document.getElementById('training-input') as HTMLInputElement;
                                const url = input.value;
                                if (!url) return;

                                try {
                                    input.disabled = true;
                                    const { learnFromPlaylistAction } = await import("@/app/actions");
                                    const result = await learnFromPlaylistAction(url);
                                    alert(result);
                                    input.value = "";
                                } catch (e) {
                                    console.error(e);
                                    alert("Training failed.");
                                } finally {
                                    input.disabled = false;
                                }
                            }}
                            className="bg-purple-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Train AI
                        </button>
                    </div>
                </div>

                {/* S3 Storage Config */}
                <S3ConfigSection
                    saved={saved}
                    onChange={() => setSaved(false)}
                />
            </div>
        </div>
    );
}

function S3ConfigSection({ saved, onChange }: { saved: boolean, onChange: () => void }) {
    const [endpoint, setEndpoint] = useState("");
    const [region, setRegion] = useState("");
    const [accessKey, setAccessKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [bucket, setBucket] = useState("");

    useEffect(() => {
        setEndpoint(localStorage.getItem("nc_s3_endpoint") || process.env.NEXT_PUBLIC_S3_ENDPOINT || "");
        setRegion(localStorage.getItem("nc_s3_region") || process.env.NEXT_PUBLIC_S3_REGION || "auto");
        setAccessKey(localStorage.getItem("nc_s3_access_key") || process.env.NEXT_PUBLIC_S3_ACCESS_KEY || "");
        setSecretKey(localStorage.getItem("nc_s3_secret_key") || process.env.NEXT_PUBLIC_S3_SECRET_KEY || "");
        setBucket(localStorage.getItem("nc_s3_bucket") || process.env.NEXT_PUBLIC_S3_BUCKET || "");
    }, []);

    const handleSave = () => {
        localStorage.setItem("nc_s3_endpoint", endpoint);
        localStorage.setItem("nc_s3_region", region);
        localStorage.setItem("nc_s3_access_key", accessKey);
        localStorage.setItem("nc_s3_secret_key", secretKey);
        localStorage.setItem("nc_s3_bucket", bucket);
        // Trigger generic save notification if parent wants
    };

    return (
        <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center gap-4 mb-4 border-b border-border/40 pb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Cloud Vault Connection</h3>
                    <p className="text-sm text-muted-foreground">S3-Compatible Object Storage (AWS, R2, MinIO) for media assets.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Endpoint URL</label>
                    <input
                        type="text"
                        value={endpoint}
                        onChange={(e) => { setEndpoint(e.target.value); onChange(); }}
                        placeholder="https://<account>.r2.cloudflarestorage.com"
                        className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Leave empty for standard AWS S3.</p>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Region</label>
                    <input
                        type="text"
                        value={region}
                        onChange={(e) => { setRegion(e.target.value); onChange(); }}
                        placeholder="auto, us-east-1, etc."
                        className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Access Key ID</label>
                    <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => { setAccessKey(e.target.value); onChange(); }}
                        placeholder="AKIA..."
                        className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Secret Access Key</label>
                    <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => { setSecretKey(e.target.value); onChange(); }}
                        placeholder="••••••••"
                        className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div className="md:col-span-2 grid gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Bucket Name</label>
                    <input
                        type="text"
                        value={bucket}
                        onChange={(e) => { setBucket(e.target.value); onChange(); }}
                        placeholder="my-neuro-code-assets"
                        className="bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSave}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                    Save S3 Config
                </button>
            </div>
        </div>
    );
}
