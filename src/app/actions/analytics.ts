"use server";

import { generateChannelAudit, ChannelAuditResult, ChannelAuditData, generateMetricOptimization, MetricOptimizationResult } from "@/lib/gemini";
import { OutlierVideo, NEURO_CODE_CHANNEL_ID, getChannelRecentVideos } from "@/lib/youtube";
import { AnalyticsData, fetchChannelAnalytics, fetchVideoAnalytics } from "@/lib/youtube-analytics";

export async function fetchAnalyticsAction(accessToken: string): Promise<AnalyticsData | null> {
    return await fetchChannelAnalytics(accessToken);
}

/**
 * Fetches channel videos with enhanced analytics data (likes, AVP, AVD)
 * Combines public data from YouTube Data API with private analytics when available
 */
export async function fetchEnhancedChannelVideosAction(accessToken?: string | null): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    try {
        // 1. Fetch public video data (includes basic likes from Data API)
        const videos = await getChannelRecentVideos(NEURO_CODE_CHANNEL_ID, apiKey);

        // 2. Try to enhance with private analytics if user has OAuth token
        if (accessToken && videos.length > 0) {
            // Fetch analytics for these videos
            const videoIds = videos.map(v => v.id);
            const analyticsMap = await fetchVideoAnalytics(accessToken, videoIds);

            // Merge analytics data into videos
            videos.forEach(video => {
                const analytics = analyticsMap.get(video.id);
                if (analytics) {
                    // Analytics API likes are more accurate than public API
                    video.likeCount = analytics.likes;
                    video.averageViewPercentage = analytics.averageViewPercentage;
                    video.averageViewDuration = analytics.averageViewDuration;
                }
            });
        }

        return videos;
    } catch (e) {
        console.error("Enhanced video fetch error:", e);
        // Fallback to basic fetch
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            return await getChannelRecentVideos(NEURO_CODE_CHANNEL_ID, apiKey);
        }
        return [];
    }
}


export async function generateChannelAuditAction(
    analyticsData: AnalyticsData,
    recentVideos: OutlierVideo[],
    mode: 'medical' | 'professional' = 'medical'
): Promise<ChannelAuditResult | null> {

    // Helper to calculate age
    const apiKey = process.env.YOUTUBE_API_KEY;
    let channelAge = "Unknown";

    if (apiKey) {
        const { getChannelData } = await import("@/lib/youtube");
        const cData = await getChannelData(apiKey);
        if (cData && cData.publishedAt) {
            const pubDate = new Date(cData.publishedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - pubDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 30) channelAge = `${diffDays} Days Old`;
            else if (diffDays < 365) channelAge = `${Math.floor(diffDays / 30)} Months Old`;
            else channelAge = `${Math.floor(diffDays / 365)} Years Old`;
        }
    }

    // Format Videos for Context
    const topVideosContext = recentVideos.slice(0, 3).map(v =>
        `- "${v.title}" (${v.viewCount} views, Score: ${v.outlierScore})`
    ).join("\n");

    const auditData: ChannelAuditData = {
        views: analyticsData.views,
        subsGained: analyticsData.subscribersGained,
        avd: (analyticsData.averageViewDuration / 60).toFixed(1) + " min",
        minutesWatched: analyticsData.estimatedMinutesWatched,
        topVideos: topVideosContext || "No recent outlier data available.",
        channelAge
    };

    return await generateChannelAudit(auditData, mode);
}

export async function generateMetricOptimizationAction(
    metricName: string,
    currentValue: string,
    channelId?: string
): Promise<MetricOptimizationResult | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    let channelAge = "Unknown";
    let niche = "General / Unknown";

    if (channelId) {
        const { getChannelData } = await import("@/lib/youtube");
        const cData = await getChannelData(apiKey);
        if (cData && cData.publishedAt) {
            const pubDate = new Date(cData.publishedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - pubDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 365) channelAge = "New Channel (< 1 Year)";
            else channelAge = "Established Channel (> 1 Year)";
        }
    }

    return await generateMetricOptimization(metricName, currentValue, { channelAge, niche });
}
