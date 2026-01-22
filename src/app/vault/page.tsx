"use client";

import { useState, useEffect, useCallback } from "react";
import { getUploadUrlAction, listFilesAction, getSystemStatusAction } from "@/app/actions";
import { S3Config, StoredFile } from "@/lib/storage";
import { Loader2, UploadCloud, FileVideo, File, Trash2, Database, RefreshCw, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

export default function VaultPage() {
    const [config, setConfig] = useState<S3Config | null>(null);
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [systemKeys, setSystemKeys] = useState<{ openai: string | null, gemini: string | null, youtube: string | null } | null>(null);

    useEffect(() => {
        // ... existing config load ...
        const endpoint = localStorage.getItem("nc_s3_endpoint") || process.env.NEXT_PUBLIC_S3_ENDPOINT;
        const region = localStorage.getItem("nc_s3_region") || process.env.NEXT_PUBLIC_S3_REGION || "auto";
        const accessKeyId = localStorage.getItem("nc_s3_access_key") || process.env.NEXT_PUBLIC_S3_ACCESS_KEY;
        const secretAccessKey = localStorage.getItem("nc_s3_secret_key") || process.env.NEXT_PUBLIC_S3_SECRET_KEY;
        const bucket = localStorage.getItem("nc_s3_bucket") || process.env.NEXT_PUBLIC_S3_BUCKET;

        if (region && accessKeyId && secretAccessKey && bucket) {
            setConfig({ endpoint: endpoint || undefined, region, accessKeyId, secretAccessKey, bucket });
        }

        // Fetch System Status
        getSystemStatusAction().then(setSystemKeys);
    }, []);

    // ... existing callbacks ...
    const refreshFiles = useCallback(async () => {
        if (!config) return;
        setLoading(true);
        try {
            const list = await listFilesAction(config);
            setFiles(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [config]);

    useEffect(() => {
        if (config) {
            refreshFiles();
        }
    }, [config, refreshFiles]);

    const onDrop = async (acceptedFiles: File[]) => {
        // ... existing onDrop ...
        if (!config || acceptedFiles.length === 0) return;
        setUploading(true);

        try {
            for (const file of acceptedFiles) {
                // 1. Get Presigned URL
                const key = `uploads/${Date.now()}-${file.name}`;
                const url = await getUploadUrlAction(config, key, file.type);

                if (!url) {
                    alert(`Failed to get upload URL for ${file.name}`);
                    continue;
                }

                // 2. Upload directly to S3
                const res = await fetch(url, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": file.type
                    }
                });

                if (!res.ok) {
                    alert(`Upload failed for ${file.name}`);
                }
            }
            await refreshFiles();
        } catch (e) {
            console.error(e);
            alert("Upload Process Error");
        } finally {
            setUploading(false);
        }
    };

    // ... existing dropzone hooks ...
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    // Render "Vault Locked" if NO config IS handled in current code, but we want to show keys even if locked?
    // User wants to see keys "as usual".
    // I will render the Keys section ABOVE the vault content or separate.

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        Cloud Vault
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        System Credentials & Asset Storage
                    </p>
                </div>
                <button onClick={refreshFiles} className="p-2 hover:bg-muted/20 rounded-lg" disabled={!config}>
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* SYSTEM KEYS SECTION (Requested by User) */}
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Neural Keys
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/20">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Google Gemini (Brain)</div>
                        <div className="font-mono text-sm text-green-400">
                            {systemKeys?.gemini ? systemKeys.gemini : <span className="text-red-500">MISSING</span>}
                        </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/20">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">OpenAI (Factory)</div>
                        <div className="font-mono text-sm text-green-400">
                            {systemKeys?.openai ? systemKeys.openai : <span className="text-red-500">MISSING</span>}
                        </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/20">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">YouTube Data API</div>
                        <div className="font-mono text-sm text-green-400">
                            {systemKeys?.youtube ? systemKeys.youtube : <span className="text-red-500">MISSING</span>}
                        </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/20">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Google Cloud (Core)</div>
                        <div className="font-mono text-sm text-green-400">
                            {(systemKeys as any)?.googleCloud ? (systemKeys as any).googleCloud : <span className="text-gray-500">OPTIONAL</span>}
                        </div>
                    </div>
                </div>

            </div>

            {/* STORAGE INTERFACE */}
            {!config ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border/40 rounded-xl bg-muted/5">
                    <div className="bg-muted/10 p-6 rounded-full">
                        <Database className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-2xl font-bold">File Vault Not Configured</h2>
                    <p className="text-muted-foreground max-w-md">
                        Please configure an S3-compatible bucket (Google Cloud Storage, AWS, R2) in Settings to enable asset storage.
                    </p>
                    <Link href="/settings" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                        Configure S3 Bucket
                    </Link>
                </div>
            ) : (
                <>
                    {/* Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragActive ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/50 hover:bg-muted/5"}`}
                    >
                        <input {...getInputProps()} />
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <UploadCloud className="w-8 h-8 text-primary" />
                        </div>
                        {uploading ? (
                            <p className="font-bold text-xl animate-pulse">Uploading Assets...</p>
                        ) : (
                            <>
                                <p className="font-bold text-lg">Drag & Drop files here, or click to select</p>
                                <p className="text-sm text-muted-foreground mt-2">Supports Video, Audio, Images (Direct Cloud Upload)</p>
                            </>
                        )}
                    </div>

                    {/* File List */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file) => (
                            <div key={file.key} className="bg-card border border-border/40 rounded-xl p-4 group relative hover:shadow-lg transition-all">
                                <div className="aspect-video bg-black/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                                    {file.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                            src={file.url}
                                            alt={file.key}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : file.key.match(/\.(mp4|mov|webm)$/i) ? (
                                        <FileVideo className="w-12 h-12 text-muted-foreground opacity-50" />
                                    ) : (
                                        <File className="w-12 h-12 text-muted-foreground opacity-50" />
                                    )}
                                </div>
                                <h4 className="font-bold text-sm truncate" title={file.key}>{file.key.split("/").pop()}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size! / 1024 / 1024).toFixed(2)} MB • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : "Unknown"}
                                </p>
                            </div>
                        ))}
                        {files.length === 0 && !loading && (
                            <div className="col-span-full text-center py-10 text-muted-foreground italic">
                                Vault is empty. Upload items or check bucket configuration.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
