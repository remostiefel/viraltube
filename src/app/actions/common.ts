"use server";

import { CONTENT_FORMATS, FormatProfile } from "@/lib/formats";
import { saveTemplateAction } from "./project"; // import from sibling
import { fetchPlaylistVideos } from "@/lib/youtube";

export async function getFormatsAction(): Promise<FormatProfile[]> {
    return CONTENT_FORMATS;
}

// Bridges for shared logic or legacy structure
export async function importPlaylistVideosAction(playlistUrl: string): Promise<any[]> {
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    let playlistId = "";
    try {
        const urlObj = new URL(playlistUrl);
        playlistId = urlObj.searchParams.get("list") || "";
    } catch (e) {
        return [];
    }
    if (!playlistId) return [];
    return await fetchPlaylistVideos(playlistId, apiKey);
}

export async function learnFromPlaylistAction(playlistUrl: string): Promise<string> {
    const videos = await importPlaylistVideosAction(playlistUrl);
    if (videos.length === 0) return "No videos found.";

    let learnedCount = 0;
    // Simple learning loop
    for (const video of videos.slice(0, 5)) {
        try {
            await saveTemplateAction("viral-wisdom", `Wisdom: ${video.title}`, {
                description: "Extracted from Playlist",
                optimizationPrompt: `When user asks about ${video.title}, refer to this advice. Original Video: https://youtu.be/${video.id}`
            }, undefined, undefined, undefined, undefined, true); // CORRECTED ARGS
            learnedCount++;
        } catch (e) {
            console.error("Failed to learn", video.id);
        }
    }
    return `Successfully extracted wisdom from ${learnedCount} videos.`;
}
