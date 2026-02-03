import { YoutubeTranscript } from 'youtube-transcript';

interface YouTubeSearchItem {
    id: { videoId: string };
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        thumbnails: {
            default?: { url: string };
            medium?: { url: string };
            high?: { url: string };
            maxres?: { url: string };
        };
    };
}

interface YouTubeVideoItem {
    id: string;
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        thumbnails: {
            default?: { url: string };
            medium?: { url: string };
            high?: { url: string };
            maxres?: { url: string };
        };
    };
    statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
    };
}

interface YouTubeChannelItem {
    id: string;
    statistics: {
        subscriberCount: string;
        viewCount: string;
        videoCount: string;
    };
}

export const NEURO_CODE_CHANNEL_ID = "UChIrxEgUIoc8tJsHj2fOlBg";

export interface ChannelStats {
    subscriberCount: string;
    viewCount: string;
    videoCount: string;
}

export interface ChannelData {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
    };
    statistics: ChannelStats;
    publishedAt: string;
}

export async function getChannelData(apiKey: string): Promise<ChannelData | null> {
    if (!apiKey) {
        console.error("YouTube API Key is missing");
        return null;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${NEURO_CODE_CHANNEL_ID}&key=${apiKey}`,
            { next: { revalidate: 0 } } // No cache for real-time validation
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("YouTube API Error:", error);
            return null;
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                customUrl: item.snippet.customUrl,
                thumbnails: item.snippet.thumbnails,
                statistics: item.statistics,
                publishedAt: item.snippet.publishedAt,
            };
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch YouTube data:", error);
        return null;
    }
}

export interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    publishedAt: string;
    channelTitle: string;
    thumbnailUrl: string;
}

export async function getVideoMetadata(videoId: string, apiKey: string): Promise<VideoMetadata | null> {
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`YouTube API Error (getVideoMetadata): ${response.status} ${response.statusText}`, errorText);
            return null;
        }

        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                viewCount: item.statistics.viewCount,
                likeCount: item.statistics.likeCount,
                commentCount: item.statistics.commentCount,
                publishedAt: item.snippet.publishedAt,
                channelTitle: item.snippet.channelTitle,
                thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url
            };
        }
        console.warn(`getVideoMetadata: No items found for videoId ${videoId}`);
        return null;
    } catch (error) {
        console.error("Error fetching video metadata:", error);
        return null;
    }
}

export async function getVideoTranscript(videoId: string): Promise<string | null> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        console.error("Error fetching transcript:", error);
        return null;
    }
}
// ... existing code ...

export interface OutlierVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    viewCount: number;
    channelTitle: string;
    channelSubs: number;
    outlierScore: number; // calculated as Views / Subs
    publishedAt: string;
    // Analytics Metrics (optional - available when fetched)
    likeCount?: number; // From Data API or Analytics API
    averageViewPercentage?: number; // From Analytics API only (0-100)
    averageViewDuration?: number; // From Analytics API only (in seconds)
}

// ... existing code ...

export async function searchOutliers(
    query: string,
    apiKey: string,
    publishedAfter?: string, // ISO Date string
    maxSubs?: number,
    gapMode?: boolean // CORTEX v2: Find "Content Gaps" (High Demand, Low Supply/Old)
): Promise<OutlierVideo[]> {
    if (!apiKey) throw new Error("API Key missing");

    try {
        let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=${gapMode ? 'viewCount' : 'viewCount'}&maxResults=${gapMode ? 25 : 15}&key=${apiKey}`;

        if (publishedAfter) {
            apiUrl += `&publishedAfter=${publishedAfter}`;
        }
        // gapMode implies we look for OLD videos usually, but API makes it hard to filter "before". 
        // Instead, if gapMode is ON, we might NOT want to restrict by date, or we restrict by "publishedBefore" (not standard search param).
        // Actually, for Gaps we want to see what is winning NOW. 
        // If we find an old video with high views, that's a gap. So we search broadly.

        const searchRes = await fetch(apiUrl, { next: { revalidate: 3600 } });

        if (!searchRes.ok) {
            const errorData = await searchRes.json();
            console.error("YouTube Search API Error:", errorData);
            throw new Error(`YouTube API Error: ${errorData.error?.message || searchRes.statusText}`);
        }
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) return [];

        // 2. We need stats for these videos to get view counts (Search API doesn't return viewCount)
        const videoIds = searchData.items.map((item: YouTubeSearchItem) => item.id.videoId).join(',');
        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
        );

        if (!statsRes.ok) {
            throw new Error("Failed to fetch video statistics");
        }

        const statsData = await statsRes.json();

        if (!statsData.items) return [];

        // 3. For each video, we need CHANNEL stats to calculate the Outlier Score
        const channelIds = [...new Set(statsData.items.map((v: YouTubeVideoItem) => v.snippet.channelId))].join(',');
        const channelsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`
        );
        const channelsData = await channelsRes.json();

        const channelMap = new Map<string, number>();
        channelsData.items?.forEach((c: YouTubeChannelItem) => {
            channelMap.set(c.id, parseInt(c.statistics.subscriberCount) || 1); // Avoid div by zero
        });

        // 4. Calculate Scores
        let outliers: OutlierVideo[] = statsData.items.map((v: YouTubeVideoItem) => {
            const views = parseInt(v.statistics.viewCount);
            const likes = parseInt(v.statistics.likeCount) || 0;
            const subs = channelMap.get(v.snippet.channelId) || 10000; // Assume 10k if unknown
            const score = views / subs;

            return {
                id: v.id,
                title: v.snippet.title,
                thumbnailUrl: v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url || "",
                viewCount: views,
                channelTitle: v.snippet.channelTitle,
                channelSubs: subs,
                outlierScore: parseFloat(score.toFixed(2)),
                publishedAt: v.snippet.publishedAt,
                likeCount: likes
            };
        });

        // CORTEX GAP LOGIC
        if (gapMode) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            // A "Gap" is defined as:
            // 1. High Views (> 50k)
            // 2. EITHER Old (> 1 year) OR Small Channel (< 10k subs)
            outliers = outliers.filter(o => {
                const isOld = new Date(o.publishedAt) < oneYearAgo;
                const isSmall = o.channelSubs < 20000;
                const hasDemand = o.viewCount > 50000;

                return hasDemand && (isOld || isSmall);
            });

            // Sort gaps by View Count (Absolute Demand) rather than outlier score
            outliers.sort((a, b) => b.viewCount - a.viewCount);
        } else {
            // Standard Outlier Sort
            outliers.sort((a: OutlierVideo, b: OutlierVideo) => b.outlierScore - a.outlierScore);
        }

        // 5. Apply Filters
        if (maxSubs && !gapMode) {
            outliers = outliers.filter(o => o.channelSubs < maxSubs);
        }

        // Lower threshold to 0.05 to catch "mild" outliers too, letting the UI decide or showing more results
        return outliers.filter(o => o.outlierScore > 0.05);

    } catch (e) {
        console.error("Outlier Search Error", e);
        throw e; // Propagate error to let the UI handle it
    }
}

export async function getChannelRecentVideos(channelId: string, apiKey: string): Promise<OutlierVideo[]> {
    if (!apiKey) return [];

    try {
        // OPTIMIZATION: Use "Uploads" Playlist instead of Search API
        // Search API = 100 units per call
        // PlaylistItems = 1 unit per call
        // 99% cost reduction.

        // 1. Get Channel "Uploads" Playlist ID
        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channelId}&key=${apiKey}`,
            { next: { revalidate: 3600 } } // Cache this for an hour, it rarely changes
        );

        if (!channelRes.ok) {
            console.error(`Channel Fetch Failed: ${channelRes.status}`);
            return [];
        }

        const channelData = await channelRes.json();
        if (!channelData.items || channelData.items.length === 0) return [];

        const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
        const subs = parseInt(channelData.items[0].statistics?.subscriberCount || "1000");

        if (!uploadsPlaylistId) return [];

        // 2. Fetch Videos from Uploads Playlist
        // We need 'snippet' for title/thumb/publishDate and 'contentDetails' for videoId
        const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`,
            { next: { revalidate: 600 } } // Cache for 10 mins
        );

        if (!playlistRes.ok) {
            console.error(`Playlist Fetch Failed: ${playlistRes.status}`);
            return [];
        }

        const playlistData = await playlistRes.json();
        if (!playlistData.items) return [];

        // 3. Get Video Statistics (View Counts) 
        // Playlist items don't have view counts, so we need one more call.
        const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`,
            { next: { revalidate: 600 } }
        );

        const statsData = await statsRes.json();
        if (!statsData.items) return [];

        // 4. Map to OutlierVideo
        const videos: OutlierVideo[] = statsData.items.map((v: YouTubeVideoItem) => {
            const views = parseInt(v.statistics.viewCount);
            const likes = parseInt(v.statistics.likeCount) || 0;
            const score = views / subs;

            return {
                id: v.id,
                title: v.snippet.title,
                thumbnailUrl: v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url || "",
                viewCount: views,
                channelTitle: v.snippet.channelTitle,
                channelSubs: subs,
                outlierScore: parseFloat(score.toFixed(2)),
                publishedAt: v.snippet.publishedAt,
                likeCount: likes
            };
        });

        return videos;

    } catch (e) {
        console.error("Channel Recent Videos Error (Optimized)", e);
        return [];
    }
}

export async function fetchPlaylistVideos(playlistId: string, apiKey: string): Promise<OutlierVideo[]> {
    if (!apiKey) return [];

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) return [];
        const data = await response.json();

        if (!data.items) return [];

        const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
        );
        const statsData = await statsRes.json();

        if (!statsData.items) return [];

        return statsData.items.map((v: any) => ({
            id: v.id,
            title: v.snippet.title,
            thumbnailUrl: v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url || "",
            viewCount: parseInt(v.statistics.viewCount) || 0,
            channelTitle: v.snippet.channelTitle,
            channelSubs: 0,
            outlierScore: 0,
            publishedAt: v.snippet.publishedAt,
            likeCount: parseInt(v.statistics.likeCount) || 0
        }));

    } catch (e) {
        console.error("Playlist Fetch Error", e);
        return [];
    }
}

export async function getVideoBasicInfoFallback(videoId: string): Promise<{ title: string; author: string } | null> {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        console.log("[YouTube] Fetching oEmbed:", oembedUrl);
        // Force no-cache to avoid sticking to failed attempts with bad IDs (though IDs should be unique keys)
        const res = await fetch(oembedUrl, { next: { revalidate: 0 } });

        if (!res.ok) {
            console.error("[YouTube] Fetch Failed:", res.status, res.statusText);

            // FALLBACK 2: Direct Page Scraping (Title Tag)
            try {
                console.log("[YouTube] Attempting Parsing Fallback...");
                const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                    headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
                });
                const html = await pageRes.text();
                const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/) || html.match(/<title>(.*?)<\/title>/);

                if (titleMatch && titleMatch[1]) {
                    return {
                        title: titleMatch[1],
                        author: "YouTube Channel" // Hard to parse cleanly from raw HTML reliably without heavy dom parser
                    };
                }
            } catch (fallbackError) {
                console.error("Fallback Parsing Failed", fallbackError);
            }

            return null;
        }

        const data = await res.json();
        console.log("[YouTube] Fetch Success:", data.title);
        return {
            title: data.title,
            author: data.author_name
        };
    } catch (e) {
        console.error("oEmbed Fallback Error:", e);
        return null;
    }
}
