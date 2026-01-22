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
            }
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
