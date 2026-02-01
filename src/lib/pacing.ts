import { GeneratedScript, ScriptSection } from "@/lib/openai";

export interface PacingDataPoint {
    time: number; // seconds from start
    timestamp: string; // "MM:SS" label
    visualDensity: number; // 0-100 (Rate of visual change)
    tension: number; // 0-100 (Cortisol)
    reward: number; // 0-100 (Dopamine)
    sectionName: string;
}

export function calculatePacingProfile(script: GeneratedScript): PacingDataPoint[] {
    const profile: PacingDataPoint[] = [];

    // Safety check for invalid content
    if (!script || !script.sections || !Array.isArray(script.sections)) {
        return [];
    }

    let currentTime = 0;

    script.sections.forEach((section) => {
        const duration = parseDuration(section.estimatedDuration);
        const density = calculateVisualDensity(section, duration);
        const { tension, reward } = calculateNeuroThematics(section);

        // Start of section
        profile.push({
            time: currentTime,
            timestamp: formatTime(currentTime),
            visualDensity: density,
            tension: tension,
            reward: reward,
            sectionName: section.heading
        });

        // End of section (mid-point for curve smoothing)
        // We add a point at the end to maintain the "level" for this section duration
        currentTime += duration;
        profile.push({
            time: currentTime,
            timestamp: formatTime(currentTime),
            visualDensity: density, // Maintain density
            tension: tension,
            reward: reward,
            sectionName: section.heading
        });
    });

    return profile;
}

function parseDuration(durationStr: string): number {
    // Expected formats: "0:30", "1:00", "45s", "1 min"
    // Default to 30s if parse fails
    try {
        if (!durationStr) return 30;

        // Handle "MM:SS" (e.g., "0:15", "11:05")
        if (durationStr.includes(":")) {
            const parts = durationStr.split(":");
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return (minutes * 60) + seconds;
        }

        // Handle "45s", "45 sec"
        if (durationStr.toLowerCase().includes("s") || durationStr.toLowerCase().includes("sec")) {
            return parseInt(durationStr) || 30;
        }

        // Handle "1 min"
        if (durationStr.toLowerCase().includes("m") || durationStr.toLowerCase().includes("min")) {
            return (parseInt(durationStr) || 1) * 60;
        }

        return 30;
    } catch {
        return 30;
    }
}

function calculateVisualDensity(section: ScriptSection, duration: number): number {
    // Heuristic: Length of visual cue text / duration
    // More complex visual description = higher density required
    const visualWords = section.visualCue.split(" ").length;
    const contentWords = section.content.split(" ").length;

    // Base density: visual words per second * modifier
    // Standard: 0.5 words/sec is "low", 2 words/sec is "high"
    let score = (visualWords / Math.max(duration, 10)) * 200;

    // Boost if content is short (fast cutting)
    if (duration < 15) score *= 1.5;

    // Cap at 100
    return Math.min(Math.round(score), 100);
}

function calculateNeuroThematics(section: ScriptSection): { tension: number, reward: number } {
    let tension = 20; // Baseline
    let reward = 20; // Baseline

    const text = (section.heading + " " + section.content).toLowerCase();

    // Tension Keywords (Problematization, Fear, Mistakes)
    const tensionKeywords = ["stop", "mistake", "fail", "warning", "danger", "secret", "trap", "lose", "waste", "problem", "struggle", "pain", "bad", "worst"];
    // Reward Keywords (Solution, Gain, Easy, Fix)
    const rewardKeywords = ["fix", "solution", "easy", "fast", "gain", "win", "result", "profit", "benefit", "good", "best", "hack", "trick", "unlock"];

    tensionKeywords.forEach(k => {
        if (text.includes(k)) tension += 15;
    });

    rewardKeywords.forEach(k => {
        if (text.includes(k)) reward += 15;
    });

    // Semantic Boosts based on Heading types
    if (section.heading.toLowerCase().includes("hook") || section.heading.toLowerCase().includes("intro")) {
        tension += 20; // Hooks need tension
    }
    if (section.heading.toLowerCase().includes("cta") || section.heading.toLowerCase().includes("outro")) {
        reward += 10; // CTA usually promises value
    }

    return {
        tension: Math.min(tension, 100),
        reward: Math.min(reward, 100)
    };
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
