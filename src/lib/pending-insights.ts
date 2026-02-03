/**
 * Pending Insights Storage
 * Manages the queue of insights awaiting user review
 */

import { WisdomCandidate } from "./wisdom-extractor";

export interface PendingInsight {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    candidate: WisdomCandidate;
    reviewedAt: string | null;
    reviewNotes: string;
}

const STORAGE_KEY = "nc_pending_insights";

/**
 * Get all pending insights from localStorage
 */
export function getPendingInsights(): PendingInsight[] {
    if (typeof window === "undefined") return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load pending insights:", e);
        return [];
    }
}

/**
 * Save pending insights to localStorage
 */
export function savePendingInsights(insights: PendingInsight[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(insights));
    } catch (e) {
        console.error("Failed to save pending insights:", e);
    }
}

/**
 * Add new insights to pending queue
 */
export function addPendingInsights(candidates: WisdomCandidate[]): void {
    const existing = getPendingInsights();

    const newInsights: PendingInsight[] = candidates.map(candidate => ({
        id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "PENDING",
        candidate,
        reviewedAt: null,
        reviewNotes: ""
    }));

    savePendingInsights([...existing, ...newInsights]);
}

/**
 * Update a pending insight
 */
export function updatePendingInsight(id: string, updates: Partial<PendingInsight>): void {
    const insights = getPendingInsights();
    const index = insights.findIndex(i => i.id === id);

    if (index !== -1) {
        insights[index] = { ...insights[index], ...updates };
        savePendingInsights(insights);
    }
}

/**
 * Delete a pending insight
 */
export function deletePendingInsight(id: string): void {
    const insights = getPendingInsights();
    savePendingInsights(insights.filter(i => i.id !== id));
}

/**
 * Get count of pending insights by status
 */
export function getPendingInsightsCount(): { pending: number; approved: number; rejected: number } {
    const insights = getPendingInsights();

    return {
        pending: insights.filter(i => i.status === "PENDING").length,
        approved: insights.filter(i => i.status === "APPROVED").length,
        rejected: insights.filter(i => i.status === "REJECTED").length
    };
}

/**
 * Clear all approved/rejected insights (cleanup)
 */
export function clearReviewedInsights(): void {
    const insights = getPendingInsights();
    savePendingInsights(insights.filter(i => i.status === "PENDING"));
}
