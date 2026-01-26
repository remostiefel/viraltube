export interface AnalyticsData {
    views: number;
    subscribersGained: number;
    averageViewDuration: number;
    estimatedMinutesWatched: number;
}

export async function fetchChannelAnalytics(accessToken: string): Promise<AnalyticsData | null> {
    // Current date (approx)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // IDs is usually "channel==MINE"
    const ids = "channel==MINE";
    const metrics = "views,subscribersGained,averageViewDuration,estimatedMinutesWatched";

    try {
        const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=${ids}&startDate=${startStr}&endDate=${endStr}&metrics=${metrics}&dimensions=channel&sort=-views`;

        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json"
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            console.error("Analytics API Error:", await res.text());
            return null;
        }

        const data = await res.json();
        // data.rows[0] contains the metrics.
        // Order matches the metrics param string.
        // [views, subscribersGained, averageViewDuration, estimatedMinutesWatched]

        if (!data.rows || data.rows.length === 0) return null;

        const row = data.rows[0];
        return {
            views: row[0],
            subscribersGained: row[1],
            averageViewDuration: row[2], // Seconds
            estimatedMinutesWatched: row[3]
        };

    } catch (e) {
        console.error("Fetch Analytics Exception:", e);
        return null;
    }
}

// --- CORTEX v2026: The Satisfaction Core ---

export interface SatisfactionMetrics {
    score: number; // 0-100
    grade: "S" | "A" | "B" | "C" | "F";
    sentiment: "Love" | "Like" | "Neutral" | "Dislike";
    reasons: string[];
}

/**
 * Calculates the "True Satisfaction" of a video based on the CORTEX Formula.
 * Weights:
 * - Satisfaction (Likes/Comments): 35%
 * - AVD (Retention): 25%
 * - CTR (Click Quality): 20%
 * - Return (Simulated via return viewers/loyalty): 20%
 */
export function calculateSatisfactionScore(
    views: number,
    likes: number,
    comments: number,
    avgViewDurationSeconds: number,
    videoLengthSeconds: number, // Need to fetch this or estimate
    ctr: number
): SatisfactionMetrics {

    if (views === 0) return { score: 0, grade: "F", sentiment: "Neutral", reasons: ["No Data"] };

    // 1. Viewer Delight (35%)
    // Benchmark: 4% Like-to-View ratio is "Good". 
    const likeRatio = likes / views;
    const commentRatio = comments / views;
    const delightScore = Math.min(100, (likeRatio / 0.04) * 80 + (commentRatio / 0.005) * 20);

    // 2. Retention (25%) -> AVD
    // Benchmark: 40% retention is "Good" for long form.
    const retentionPct = videoLengthSeconds > 0 ? (avgViewDurationSeconds / videoLengthSeconds) : 0;
    const retentionScore = Math.min(100, (retentionPct / 0.40) * 100);

    // 3. CTR Quality (20%) -> QCR logic applied later, here raw CTR
    // Benchmark: 5% is "Good".
    const ctrScore = Math.min(100, (ctr / 5) * 100);

    // 4. Loyalty/Return (20%)
    // Hard to measure without advanced API. We simulate via "Comment Velocity" or High Delight.
    // If Delight is > 80, we assume Loyalty is high.
    const loyaltyScore = delightScore > 80 ? 100 : delightScore;

    // Weighted Sum
    let totalScore = (delightScore * 0.35) + (retentionScore * 0.25) + (ctrScore * 0.20) + (loyaltyScore * 0.20);
    totalScore = Math.round(totalScore);

    // Grading
    let grade: SatisfactionMetrics["grade"] = "F";
    if (totalScore >= 90) grade = "S";
    else if (totalScore >= 80) grade = "A";
    else if (totalScore >= 70) grade = "B";
    else if (totalScore >= 50) grade = "C";

    // Sentiment
    let sentiment: SatisfactionMetrics["sentiment"] = "Neutral";
    if (totalScore >= 80) sentiment = "Love";
    else if (totalScore >= 60) sentiment = "Like";
    else if (totalScore < 40) sentiment = "Dislike";

    // Diagnostic Reasons
    const reasons: string[] = [];
    if (delightScore < 50) reasons.push("Low Engagement (Likes/Comments)");
    if (retentionScore < 50) reasons.push("Viewers drop off early");
    if (ctrScore < 50) reasons.push("Packaging not attractive (Low CTR)");
    if (delightScore > 90) reasons.push("Community Loves this!");

    return { score: totalScore, grade, sentiment, reasons };
}

/**
 * Calculates Quality Click Ratio (QCR)
 * Logic: High CTR (>8%) but Low AVD (<30s) = Clickbait Warning.
 */
export function calculateQCR(ctr: number, avdSeconds: number): { qcr: "Good" | "Bad" | "Neutral", warning?: string } {
    if (ctr > 8 && avdSeconds < 30) {
        return { qcr: "Bad", warning: "Possible Clickbait: High CTR but low retention." };
    }
    if (ctr > 5 && avdSeconds > 60) {
        return { qcr: "Good" };
    }
    return { qcr: "Neutral" };
}

/**
 * Checks for "Zombie Subscribers"
 * Rule: If Views < 10% of Subscribers, the channel has low active loyalty.
 */
export function calculateZombieScore(views: number, subscribers: number): { isZombieRisk: boolean, activeRatio: number } {
    if (subscribers < 1000) return { isZombieRisk: false, activeRatio: 1 }; // Ignore small channels

    // We expect at least 5-10% of subs to return for a video in healthy channels (varies wildly but is a generic CORTEX rule)
    const ratio = views / subscribers;
    return {
        isZombieRisk: ratio < 0.05,
        activeRatio: ratio
    };
}
