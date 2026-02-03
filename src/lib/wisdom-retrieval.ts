/**
 * Wisdom Retrieval System
 * Provides context-aware access to the Wisdom Pool for production workflows
 */

import { Template } from "./templates";

export interface WisdomFilter {
    categories?: ("LAW" | "FACT" | "GROWTH")[];
    tags?: string[];
    minConfidence?: number;
    source?: ("FULL_SCAN" | "SURGEON" | "AUDIT" | "MANUAL")[];
    searchQuery?: string;
}

export interface EnrichedWisdom extends Template {
    relevanceScore?: number;
    tags: string[];
    confidence?: number;
    source?: string;
}

/**
 * Auto-tag wisdom based on content analysis
 */
export function autoTagWisdom(wisdom: Template): string[] {
    const tags: string[] = [];
    const content = JSON.stringify(wisdom.content).toLowerCase();
    const name = wisdom.name.toLowerCase();
    const text = content + " " + name;

    // Hook-related
    if (text.includes("hook") || text.includes("einstieg") || text.includes("erste") || text.includes("opening")) {
        tags.push("hook");
    }

    // Retention-related
    if (text.includes("retention") || text.includes("pacing") || text.includes("drop-off") || text.includes("engagement")) {
        tags.push("retention");
    }

    // Script-related
    if (text.includes("script") || text.includes("struktur") || text.includes("storytelling") || text.includes("narrative")) {
        tags.push("scripting");
    }

    // Topic-specific
    if (text.includes("dopamin") || text.includes("dopamine")) tags.push("dopamine-topic");
    if (text.includes("licht") || text.includes("light")) tags.push("light-topic");
    if (text.includes("schlaf") || text.includes("sleep")) tags.push("sleep-topic");
    if (text.includes("kaffee") || text.includes("coffee") || text.includes("caffeine")) tags.push("caffeine-topic");

    // Psychological triggers
    if (text.includes("trigger") || text.includes("psycholog") || text.includes("emotion")) {
        tags.push("psychological");
    }

    // Sentiment
    if (text.includes("sentiment") || text.includes("gefühl") || text.includes("emotion")) {
        tags.push("sentiment");
    }

    // Visual
    if (text.includes("visual") || text.includes("thumbnail") || text.includes("bild")) {
        tags.push("visual");
    }

    // Title/SEO
    if (text.includes("title") || text.includes("titel") || text.includes("seo") || text.includes("clickbait")) {
        tags.push("title");
    }

    // Audience
    if (text.includes("zielgruppe") || text.includes("audience") || text.includes("target")) {
        tags.push("audience");
    }

    return tags.length > 0 ? tags : ["general"];
}

/**
 * Calculate relevance score based on context
 */
export function calculateRelevance(wisdom: EnrichedWisdom, context: string): number {
    let score = 0;
    const contextLower = context.toLowerCase();

    // Tag matching (highest weight)
    wisdom.tags.forEach(tag => {
        if (contextLower.includes(tag)) {
            score += 3;
        }
    });

    // Name matching
    const nameLower = wisdom.name.toLowerCase();
    const nameWords = nameLower.split(" ");
    nameWords.forEach(word => {
        if (word.length > 3 && contextLower.includes(word)) {
            score += 2;
        }
    });

    // Category bonus
    if (wisdom.wisdomCategory === "LAW") score += 1; // Universal principles are always relevant

    // Confidence bonus
    if (wisdom.confidence && wisdom.confidence > 0.8) score += 1;

    return score;
}

/**
 * Filter wisdom pool based on criteria
 */
export function filterWisdom(wisdomPool: Template[], filter: WisdomFilter): EnrichedWisdom[] {
    let enriched: EnrichedWisdom[] = wisdomPool
        .filter(w => w.type === "viral-wisdom")
        .map(w => {
            const tags = autoTagWisdom(w);
            const metadata = (w.content as any)?.metadata || {};

            return {
                ...w,
                tags,
                confidence: metadata.confidence || 0.7,
                source: metadata.source || "MANUAL"
            };
        });

    // Apply category filter
    if (filter.categories && filter.categories.length > 0) {
        enriched = enriched.filter(w =>
            w.wisdomCategory && filter.categories!.includes(w.wisdomCategory)
        );
    }

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
        enriched = enriched.filter(w =>
            w.tags.some(tag => filter.tags!.includes(tag))
        );
    }

    // Apply confidence filter
    if (filter.minConfidence !== undefined) {
        enriched = enriched.filter(w =>
            (w.confidence || 0) >= filter.minConfidence!
        );
    }

    // Apply source filter
    if (filter.source && filter.source.length > 0) {
        enriched = enriched.filter(w =>
            filter.source!.includes(w.source as any)
        );
    }

    // Apply search query
    if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        enriched = enriched.filter(w => {
            const searchText = (w.name + JSON.stringify(w.content)).toLowerCase();
            return searchText.includes(query);
        });
    }

    return enriched;
}

/**
 * Get wisdom suggestions for a specific workflow context
 */
export function getWisdomForContext(
    wisdomPool: Template[],
    context: "hook" | "script" | "idea" | "title" | "general",
    additionalContext?: string
): EnrichedWisdom[] {
    const contextMap: Record<typeof context, WisdomFilter> = {
        hook: {
            tags: ["hook", "retention", "psychological"],
            categories: ["LAW", "FACT"],
            minConfidence: 0.6
        },
        script: {
            tags: ["scripting", "retention", "sentiment"],
            categories: ["LAW", "GROWTH"],
            minConfidence: 0.5
        },
        idea: {
            tags: ["general"],
            categories: ["LAW", "GROWTH", "FACT"],
            minConfidence: 0.5
        },
        title: {
            tags: ["title", "hook", "psychological"],
            categories: ["LAW"],
            minConfidence: 0.7
        },
        general: {
            minConfidence: 0.5
        }
    };

    let filtered = filterWisdom(wisdomPool, contextMap[context]);

    // Calculate relevance if additional context provided
    if (additionalContext) {
        filtered = filtered.map(w => ({
            ...w,
            relevanceScore: calculateRelevance(w, additionalContext)
        }));

        // Sort by relevance
        filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else {
        // Sort by confidence
        filtered.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    }

    return filtered.slice(0, 10); // Return top 10
}

/**
 * Format wisdom for AI prompt injection
 */
export function formatWisdomForPrompt(wisdoms: EnrichedWisdom[]): string {
    if (wisdoms.length === 0) return "";

    let prompt = "\n\n## 🧠 Bewährte Wisdom aus Analytics:\n\n";

    wisdoms.forEach((w, i) => {
        const content = w.content as any;
        const principle = content.principle || content.description || w.name;
        const explanation = content.explanation || content.optimizationPrompt || "";

        prompt += `${i + 1}. **${principle}**\n`;
        if (explanation) {
            prompt += `   ${explanation.slice(0, 150)}${explanation.length > 150 ? "..." : ""}\n`;
        }
        if (w.confidence) {
            prompt += `   _(Confidence: ${Math.round(w.confidence * 100)}%)_\n`;
        }
        prompt += "\n";
    });

    prompt += "**Bitte berücksichtige diese bewährten Patterns bei der Generierung.**\n";

    return prompt;
}
