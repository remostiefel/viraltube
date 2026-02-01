export interface FormatProfile {
    id: string;
    label: string;
    description: string;
    targetDurationSeconds: number;
    targetWordCount: number; // The "Physics" constraint
    visualPacingSeconds: number; // 1 scene per X seconds
    structure: string[]; // e.g., ["Hook", "Value", "CTA"]
    isLoop: boolean;
    voiceSpeed?: number; // 1.0 = normal, 1.1 = fast
}

export const CONTENT_FORMATS: FormatProfile[] = [
    {
        id: "micro-short",
        label: "Micro-Short (30s)",
        description: "High-velocity viral loop. Maximum retention.",
        targetDurationSeconds: 30,
        targetWordCount: 85, // ~170wpm speed
        visualPacingSeconds: 3, // Very fast cuts
        structure: ["Visual Hook (0-3s)", "The Problem (3-15s)", "The Solution (15-25s)", "The Loop (25-30s)"],
        isLoop: true,
        voiceSpeed: 1.15
    },
    {
        id: "standard-short",
        label: "Standard Short (60s)",
        description: "Balanced narrative for regular Reels/Shorts.",
        targetDurationSeconds: 60,
        targetWordCount: 160,
        visualPacingSeconds: 5,
        structure: ["Hook", "Agitation", "Solution", "Evidence", "CTA"],
        isLoop: false,
        voiceSpeed: 1.1
    },
    {
        id: "deep-short",
        label: "Deep Short (90s)",
        description: "Nuanced explanation. Good for LinkedIn/TikTok Long.",
        targetDurationSeconds: 90,
        targetWordCount: 240,
        visualPacingSeconds: 6,
        structure: ["Context", "The Myth", "The Truth", "The Mechanism", "Application"],
        isLoop: false,
        voiceSpeed: 1.05
    },
    {
        id: "deep-dive",
        label: "Deep Dive / Essay",
        description: "YouTube Longform. Authority building.",
        targetDurationSeconds: 300, // 5 mins baseline
        targetWordCount: 800,
        visualPacingSeconds: 10, // Slower, more B-Roll
        structure: ["The Hook", "The Setup", "The Deep Dive", "The Solution", "The Outro"],
        isLoop: false,
        voiceSpeed: 1.0
    }
];

export function getFormatById(id: string): FormatProfile {
    return CONTENT_FORMATS.find(f => f.id === id) || CONTENT_FORMATS[1]; // Default to Standard Short
}

export function calculateAssetCount(format: FormatProfile): number {
    return Math.ceil(format.targetDurationSeconds / format.visualPacingSeconds);
}
