/**
 * Wisdom Extractor - Automated Learning from Analytics
 * Extracts actionable insights from Full Scan, Surgeon Reports, and Channel Audits
 */

import { ViralAnalysisResult } from "./openai";
import { RetentionAnalysis, ChannelAuditResult } from "./gemini";

export interface WisdomCandidate {
    source: "FULL_SCAN" | "SURGEON" | "AUDIT";
    sourceId: string; // Video ID or Report ID
    category: "LAW" | "FACT" | "GROWTH";
    principle: string;
    explanation: string;
    confidence: number; // 0-1 Score
    metadata: {
        videoTitle?: string;
        viralScore?: number;
        hookScore?: number;
        timestamp: string;
    };
}

/**
 * Extract insights from Full Scan (Viral Analysis)
 */
export function extractInsightsFromFullScan(
    analysis: ViralAnalysisResult,
    videoId: string,
    videoTitle: string
): WisdomCandidate[] {
    const insights: WisdomCandidate[] = [];

    // Extract Hook Pattern if score is high
    if (analysis.viralScore >= 7) {
        insights.push({
            source: "FULL_SCAN",
            sourceId: videoId,
            category: "LAW",
            principle: `Erfolgreicher Hook-Ansatz (Viral Score: ${analysis.viralScore}/10)`,
            explanation: `Hook-Analyse: ${analysis.hookAnalysis}. Zielgruppe: ${analysis.targetAudience}. Takeaway: ${analysis.actionableTakeaway}`,
            confidence: analysis.viralScore / 10,
            metadata: {
                videoTitle,
                viralScore: analysis.viralScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Extract Sentiment Patterns
    if (analysis.sentiments && analysis.sentiments.length > 0) {
        insights.push({
            source: "FULL_SCAN",
            sourceId: videoId,
            category: "LAW",
            principle: `Sentiment-Strategie: ${analysis.sentiments.slice(0, 2).join(" + ")}`,
            explanation: `Erfolgreiche Sentiment-Kombination in diesem Video. Zielgruppe: ${analysis.targetAudience}. Diese emotionale Ansprache erzeugt starkes Engagement.`,
            confidence: Math.min(0.9, analysis.viralScore / 10 + 0.1),
            metadata: {
                videoTitle,
                viralScore: analysis.viralScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Extract Structure Pattern if available
    if (analysis.structureAnalysis && analysis.structureAnalysis.length > 0) {
        const structureDesc = analysis.structureAnalysis.map(s => s.phase).join(" → ");
        insights.push({
            source: "FULL_SCAN",
            sourceId: videoId,
            category: "FACT",
            principle: `Erfolgreiche Video-Struktur: ${structureDesc}`,
            explanation: `Diese narrative Struktur hat sich als effektiv erwiesen (Viral Score: ${analysis.viralScore}/10). Kann für ähnliche Themen adaptiert werden.`,
            confidence: 0.75,
            metadata: {
                videoTitle,
                viralScore: analysis.viralScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Extract Optimization Insights
    if (analysis.optimizationPrompt) {
        insights.push({
            source: "FULL_SCAN",
            sourceId: videoId,
            category: "GROWTH",
            principle: "Optimierungs-Strategie aus erfolgreicher Analyse",
            explanation: analysis.optimizationPrompt.slice(0, 200),
            confidence: 0.7,
            metadata: {
                videoTitle,
                viralScore: analysis.viralScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    return insights;
}

/**
 * Extract insights from Surgeon Report (Retention Analysis)
 */
export function extractInsightsFromSurgeonReport(
    analysis: RetentionAnalysis,
    videoId: string,
    videoTitle: string
): WisdomCandidate[] {
    const insights: WisdomCandidate[] = [];

    // Extract Hook Performance
    if (analysis.hookScore >= 8) {
        insights.push({
            source: "SURGEON",
            sourceId: videoId,
            category: "LAW",
            principle: `Hochperformanter Hook (Score: ${analysis.hookScore}/10)`,
            explanation: `Trigger verwendet: ${analysis.triggerUsed}. Drop-Off Risk: ${analysis.dropOffRisk}. Dieser Hook-Typ zeigt exzellente Retention in den ersten Sekunden.`,
            confidence: analysis.hookScore / 10,
            metadata: {
                videoTitle,
                hookScore: analysis.hookScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Extract Retention Strategy from improvement suggestions
    if (analysis.improvement) {
        insights.push({
            source: "SURGEON",
            sourceId: videoId,
            category: "GROWTH",
            principle: "Retention-Optimierung: " + analysis.improvement.slice(0, 80),
            explanation: `Bewährte Strategie zur Retention-Verbesserung. Drop-Off Risk: ${analysis.dropOffRisk}. Trigger: ${analysis.triggerUsed}`,
            confidence: 0.8,
            metadata: {
                videoTitle,
                hookScore: analysis.hookScore,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Extract Critical Moments
    if (analysis.dropOffRisk === "Low" || analysis.dropOffRisk === "Niedrig") {
        if (analysis.hookScore >= 7) {
            insights.push({
                source: "SURGEON",
                sourceId: videoId,
                category: "FACT",
                principle: "Erfolgreiche Pacing-Strategie",
                explanation: `Dieses Video zeigt optimales Pacing ohne kritische Drop-Off Points. Hook Score: ${analysis.hookScore}/10. Trigger: ${analysis.triggerUsed}. Die Struktur hält Zuschauer durchgehend engagiert.`,
                confidence: 0.85,
                metadata: {
                    videoTitle,
                    hookScore: analysis.hookScore,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    return insights;
}

/**
 * Extract insights from Channel Audit
 */
export function extractInsightsFromChannelAudit(
    audit: ChannelAuditResult
): WisdomCandidate[] {
    const insights: WisdomCandidate[] = [];

    // Extract Wins as Growth Patterns
    audit.wins.forEach((win) => {
        insights.push({
            source: "AUDIT",
            sourceId: `audit-${Date.now()}`,
            category: "GROWTH",
            principle: win.title,
            explanation: win.description,
            confidence: 0.7,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    });

    // Extract Opportunities as Actionable Insights
    audit.opportunities.slice(0, 2).forEach((opp) => {
        insights.push({
            source: "AUDIT",
            sourceId: `audit-${Date.now()}`,
            category: "GROWTH",
            principle: opp.title,
            explanation: opp.description,
            confidence: 0.65,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    });

    return insights;
}

/**
 * Categorize insight based on content analysis
 */
export function categorizeInsight(principle: string, explanation: string): "LAW" | "FACT" | "GROWTH" {
    const text = (principle + " " + explanation).toLowerCase();

    // LAW: Universal principles, psychological patterns, formulas
    if (
        text.includes("trigger") ||
        text.includes("psycholog") ||
        text.includes("hook") ||
        text.includes("prinzip") ||
        text.includes("gesetz") ||
        text.includes("universal")
    ) {
        return "LAW";
    }

    // GROWTH: Meta-strategies, optimization, channel growth
    if (
        text.includes("growth") ||
        text.includes("wachstum") ||
        text.includes("optimier") ||
        text.includes("strategie") ||
        text.includes("channel") ||
        text.includes("retention")
    ) {
        return "GROWTH";
    }

    // FACT: Specific findings, data points, observations
    return "FACT";
}
