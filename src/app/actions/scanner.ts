"use server";

import { searchOutliers, OutlierVideo, getChannelRecentVideos, getChannelData, ChannelData, getVideoMetadata, getVideoTranscript } from "@/lib/youtube";
import { analyzeViralVideoContent, ViralAnalysisResult } from "@/lib/openai";
import { synthesizeStrategy } from "@/lib/gemini";

export async function fetchChannelInsights(): Promise<ChannelData | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return null;
    }
    return await getChannelData(apiKey);
}

export async function fetchRecentChannelVideosAction(): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    // Lazy import
    const { getChannelRecentVideos, NEURO_CODE_CHANNEL_ID } = await import("@/lib/youtube");

    // We fetch for our specific channel
    return await getChannelRecentVideos(NEURO_CODE_CHANNEL_ID, apiKey);
}

export async function searchOutliersAction(query: string, publishedAfter?: string, maxSubs?: number, gapMode?: boolean): Promise<OutlierVideo[]> {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "";
    if (!apiKey) throw new Error("API Key configuration missing");
    return await searchOutliers(query, apiKey, publishedAfter, maxSubs, gapMode);
}

export async function synthesizeStrategyAction(inputs: string, context?: string): Promise<string> {
    const fullInput = context ? `${inputs}\n\nCONTEXT & WISDOM:\n${context}` : inputs;
    return await synthesizeStrategy(fullInput);
}

export async function fetchChannelVideosAction(channelId: string): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    return await getChannelRecentVideos(channelId, apiKey);
}

export async function analyzeViralVideoAction(url: string): Promise<ViralAnalysisResult | { error: string } | null> {
    try {
        let videoId = "";
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "youtu.be") {
                videoId = urlObj.pathname.slice(1);
            } else if (urlObj.hostname.includes("youtube.com")) {
                videoId = urlObj.searchParams.get("v") || "";
            }
        } catch (e) {
            return { error: "Invalid URL format" };
        }

        if (!videoId) return { error: "Could not extract Video ID" };

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return { error: "Server Configuration Error: Missing API Key" };

        const metadata = await getVideoMetadata(videoId, apiKey);
        if (!metadata) return { error: "Could not fetch video metadata (Check URL or API availability)" };

        // Try to get transcript, but fallback to metadata if unavailable
        let transcript = await getVideoTranscript(videoId);

        if (!transcript) {
            // Fallback: Use metadata for analysis
            console.log('[Full Scan] Transcript unavailable, using metadata fallback');
            transcript = `[NOTE: TRANSCRIPT UNAVAILABLE - ANALYZING METADATA]

VIDEO TITLE: ${metadata.title}

VIDEO DESCRIPTION:
${metadata.description}`;
        }

        const analysis = await analyzeViralVideoContent(transcript, {
            title: metadata.title,
            views: metadata.viewCount,
            likes: metadata.likeCount
        });

        if (!analysis) return { error: "AI Analysis Failed" };

        return analysis;
    } catch (error) {
        console.error("Action Error:", error);
        return { error: "Internal Server Error" };
    }
}
