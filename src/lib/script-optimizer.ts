
import { analyzeHookRetention } from "@/lib/gemini";

export interface ScriptAnalysisResult {
    totalScore: number;
    metrics: {
        burstiness: number;
        hook: number;
        voice: number;
        antiAi: number;
    };
    feedback: string[];
    flaggedPhrases: string[];
}

// 1. BURSTINESS (40%) - Sentence Length Variation
function calculateBurstiness(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 5) return 0.5; // Not enough data

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    let variations = 0;

    for (let i = 1; i < lengths.length; i++) {
        // Calculate percentage difference between adjacent sentences
        const diff = Math.abs(lengths[i] - lengths[i - 1]);
        const max = Math.max(lengths[i], lengths[i - 1]);
        if (max > 0 && (diff / max) > 0.3) { // >30% length difference counts as a "burst"
            variations++;
        }
    }

    // Target: At least 50% of sentence transitions should be "bursty"
    const score = Math.min(1, (variations / (sentences.length - 1)) * 2);
    return Math.round(score * 100) / 100;
}

// 3. PERSONAL VOICE (15%) - "I" vs "They"
function calculateVoiceScore(text: string): number {
    const iCount = (text.match(/\b(i|me|my|mine|we|our|us)\b/gi) || []).length;
    const academicCount = (text.match(/\b(studies|research|scholars|scientists|data|comprehensive)\b/gi) || []).length;

    if (iCount === 0 && academicCount > 0) return 0.2; // Too dry
    if (iCount > academicCount) return 1.0; // Good personal grounding
    if (iCount > 0) return 0.8;
    return 0.5; // Neutral
}

// 4. ANTI-AI (10%) - Blacklisted Words
const AI_PHRASES = [
    "delve", "comprehensive", "landscape", "testament", "tapestry", "moreover",
    "consequently", "realm", "underscores", "pivotal", "nuance", "intricate", "fostering"
];

function checkAntiAi(text: string): { score: number, flagged: string[] } {
    const flagged = AI_PHRASES.filter(phrase => new RegExp(`\\b${phrase}\\b`, 'yi').test(text));
    const score = Math.max(0, 1 - (flagged.length * 0.2)); // -20% per offense
    return { score, flagged };
}

export async function analyzeScript(scriptContent: string): Promise<ScriptAnalysisResult> {

    // 1. Burstiness
    const burstinessRaw = calculateBurstiness(scriptContent);
    const burstinessWeighted = burstinessRaw * 40; // Max 40

    // 2. Hook (Async LLM Check)
    // We analyze the first 500 chars for the hook
    const hookSnippet = scriptContent.slice(0, 500);
    // Use a default safe value if API check fails or takes too long, 
    // but ideally we await the real check.
    let hookRaw = 0.5;
    try {
        const hookAnalysis = await analyzeHookRetention(hookSnippet);
        hookRaw = (hookAnalysis?.hookScore || 50) / 100;
    } catch (e) {
        console.warn("Hook analysis failed, using default neutral score");
    }
    const hookWeighted = hookRaw * 30; // Max 30

    // 3. Voice
    const voiceRaw = calculateVoiceScore(scriptContent);
    const voiceWeighted = voiceRaw * 15; // Max 15

    // 4. Anti-AI
    const { score: aiRaw, flagged } = checkAntiAi(scriptContent);
    const aiWeighted = aiRaw * 15; // Max 15 (Plan said 10, but let's balance 100 total: 40+30+15+15=100)

    const total = burstinessWeighted + hookWeighted + voiceWeighted + aiWeighted;

    const feedback: string[] = [];
    if (burstinessRaw < 0.6) feedback.push("⚠️ Monotone Sentence Structure: Vary short and long sentences more.");
    if (hookRaw < 0.7) feedback.push("⚠️ Weak Hook: First 3 seconds need more 'Pattern Interrupt'.");
    if (voiceRaw < 0.6) feedback.push("⚠️ Too Clinical: Use more personal pronouns ('I', 'We') and personal stories.");
    if (aiRaw < 1) feedback.push(`⚠️ AI-Speak Detected: Remove words like [${flagged.join(", ")}].`);

    return {
        totalScore: Math.round(total),
        metrics: {
            burstiness: burstinessRaw,
            hook: hookRaw,
            voice: voiceRaw,
            antiAi: aiRaw
        },
        feedback,
        flaggedPhrases: flagged
    };
}
