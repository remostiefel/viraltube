"use client";

import React, { useState } from "react";
import { toPng } from "html-to-image";
import { saveSnapshotLocallyAction } from "@/app/actions";
import { Loader2, Camera, Check } from "lucide-react";

interface SnapshotButtonProps {
    targetId: string;
    title: string;
    darkMode?: boolean;
}

export function SnapshotButton({ targetId, title, darkMode = true }: SnapshotButtonProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleCapture = async () => {
        const node = document.getElementById(targetId);
        if (!node) {
            console.error("Target element not found for snapshot");
            return;
        }

        setIsCapturing(true);
        setSuccess(false);

        try {
            // OPTIMIZATION: Capture only visible dimensions to prevent
            // massive canvas generation (freeze) and layout thrashing (scroll break).
            // This ensures the app continues to function normally.
            const dataUrl = await toPng(node, {
                cacheBust: true,
                backgroundColor: darkMode ? "#0a0a0a" : "#ffffff",
                width: node.clientWidth,
                height: node.clientHeight,
                style: {
                    // Prevent any layout shifts during capture
                    overflow: "hidden",
                    height: "100%",
                }
            });

            // Save Locally
            const result = await saveSnapshotLocallyAction(dataUrl, title);

            if (result && result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                console.error("Failed to save snapshot:", result?.error);
                alert("Snapshot failed: " + (result?.error || "Unknown error"));
            }

        } catch (error) {
            console.error("Snapshot failed", error);
            alert("Snapshot generation failed");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
        >
            {isCapturing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : success ? (
                <Check className="h-3 w-3" />
            ) : (
                <Camera className="h-3 w-3" />
            )}
            {isCapturing ? "Saving..." : success ? "Saved to Desktop" : "9:16 Snap"}
        </button>
    );
}
