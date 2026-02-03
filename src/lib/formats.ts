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
    customInstructions?: string;
}

export const CONTENT_FORMATS: FormatProfile[] = [
    {
        id: "nano-short",
        label: "12s-Short (Nano)",
        description: "Hard Hook + Loop. The NeuroCode Retention Hack.",
        targetDurationSeconds: 12,
        targetWordCount: 40,
        visualPacingSeconds: 2,
        structure: ["HARD HOOK (0-2s)", "INTERRUPT (2-4s)", "NEURO-CLAIM (4-8s)", "EDGE-TWIST (8-10s)", "LOOP (10-12s)"],
        isLoop: true,
        voiceSpeed: 1.2,
        customInstructions: `
        [FORMAT: 12s-SHORT RETENTION HACK]
        Mandatory Structure:
        1. HARD HOOK (0-2s): Provocative statement, max 6 words.
        2. INTERRUPT (2-4s): Negation or perspective shift ("Not X, but Y").
        3. NEURO-CLAIM (4-8s): Scientific sounding explanation, but incomplete.
        4. EDGE-TWIST (8-10s): Increases tension, implies meaning without explaining.
        5. LOOP (10-12s): REPEAT the Hook (or near identical) to create an infinite loop.
        No CTA. No Tips. Pure retention mechanics.
        `
    },
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
        isLoop: true,
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
        isLoop: true,
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
