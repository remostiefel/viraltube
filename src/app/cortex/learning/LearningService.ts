
import { getChannelData, getChannelRecentVideos, OutlierVideo } from "@/lib/youtube";
import fs from "fs/promises";
import path from "path";

const PROFILE_PATH = path.join(process.cwd(), "src/data/style_profile.json");

export interface StyleProfile {
    tone: "hype" | "balanced" | "scientific";
    pacing: "fast" | "moderate" | "slow";
    hookType: string;
    avgSentenceLength: number;
    keywords: string[];
    heroArchetype: string;
}

export interface LearningData {
    version: string;
    lastUpdated: string;
    confidenceScore: number;
    profile: StyleProfile;
    recentWins: string[]; // Video IDs
    recentLosses: string[];
}

export class LearningService {

    private static async getProfile(): Promise<LearningData> {
        try {
            const data = await fs.readFile(PROFILE_PATH, "utf-8");
            return JSON.parse(data) as LearningData;
        } catch (e) {
            // Return default
            return {
                version: "1.0",
                lastUpdated: new Date().toISOString(),
                confidenceScore: 0.5,
                profile: {
                    tone: "balanced",
                    pacing: "fast",
                    hookType: "curiosity",
                    avgSentenceLength: 12,
                    keywords: [],
                    heroArchetype: "The Guide"
                },
                recentWins: [],
                recentLosses: []
            };
        }
    }

    private static async saveProfile(data: LearningData) {
        await fs.writeFile(PROFILE_PATH, JSON.stringify(data, null, 2));
    }

    static async learnFromPerformance(apiKey: string, channelId: string): Promise<string> {
        // 1. Fetch Performance Data
        const videos = await getChannelRecentVideos(channelId, apiKey);
        if (videos.length < 5) return "Not enough data to learn.";

        // 2. Identify Outliers (High Performing)
        // Simple logic: Above average views
        const totalViews = videos.reduce((acc, v) => acc + v.viewCount, 0);
        const avgViews = totalViews / videos.length;

        const winners = videos.filter(v => v.viewCount > avgViews * 1.2); // 20% better
        const losers = videos.filter(v => v.viewCount < avgViews * 0.8); // 20% worse

        if (winners.length === 0) return "No significant wins detected yet.";

        // 3. Extract Patterns (Mock Logic for now - in V2 use LLM analysis)
        // Real implementation would analyze title keywords, transcript length, etc.
        const currentData = await this.getProfile();

        // Mock Learning: If winners have short titles, prefer "fast" pacing
        const avgTitleLength = winners.reduce((acc, v) => acc + v.title.length, 0) / winners.length;

        let newPacing = currentData.profile.pacing;
        if (avgTitleLength < 40) newPacing = "fast";
        else if (avgTitleLength > 60) newPacing = "moderate";

        // Update Profile
        const updatedProfile: LearningData = {
            ...currentData,
            lastUpdated: new Date().toISOString(),
            confidenceScore: Math.min(0.95, currentData.confidenceScore + 0.05), // Increase confidence
            profile: {
                ...currentData.profile,
                pacing: newPacing,
                heroArchetype: winners.length > 2 ? "The Proven Mentor" : currentData.profile.heroArchetype
            },
            recentWins: winners.map(v => v.id).slice(0, 5)
        };

        await this.saveProfile(updatedProfile);

        return `Learning Compete. Analyzed ${videos.length} videos. Found ${winners.length} wins. Updated Pacing to ${newPacing}.`;
    }

    static async getOptimizationContext(): Promise<string> {
        const data = await this.getProfile();
        return `
        [LEARNED OPTIMIZATION PROFILE]
        Confidence: ${(data.confidenceScore * 100).toFixed(0)}%
        - Proven Tone: ${data.profile.tone}
        - Best Pacing: ${data.profile.pacing}
        - Top Keywords: ${data.profile.keywords.join(", ") || "N/A"}
        - Effective Hook: ${data.profile.hookType}
        `;
    }
}
