
export interface HumanizationConfig {
    typoRate?: number; // 0.0 to 1.0 (e.g., 0.02 for 2%)
    hesitationRate?: number; // 0.0 to 1.0
    useColloquialisms?: boolean;
    removeAiPhrases?: boolean;
}

export class Humanizer {
    private config: HumanizationConfig;

    constructor(config: HumanizationConfig = {}) {
        this.config = {
            typoRate: 0.005, // very subtle defaults
            hesitationRate: 0.01,
            useColloquialisms: true,
            removeAiPhrases: true,
            ...config
        };
    }

    public humanize(text: string): string {
        let processed = text;

        if (this.config.removeAiPhrases) {
            processed = this.removeAIPhrases(processed);
        }

        if (this.config.useColloquialisms) {
            processed = this.applyColloquialisms(processed);
        }

        if (this.config.hesitationRate && this.config.hesitationRate > 0) {
            processed = this.applyHesitations(processed);
        }

        if (this.config.typoRate && this.config.typoRate > 0) {
            processed = this.applyTypos(processed);
        }

        return processed;
    }

    private removeAIPhrases(text: string): string {
        const aiPhrases = [
            { pattern: /\bdelve into\b/gi, replacement: "look at" },
            { pattern: /\bleverage\b/gi, replacement: "use" },
            { pattern: /\bcomprehensive\b/gi, replacement: "full" },
            { pattern: /\bcrucial\b/gi, replacement: "key" },
            { pattern: /\btapestry\b/gi, replacement: "mix" },
            { pattern: /\brealm\b/gi, replacement: "world" },
            { pattern: /\bmoreover\b/gi, replacement: "plus" },
            { pattern: /\bfurthermore\b/gi, replacement: "also" },
            { pattern: /\bunderscore\b/gi, replacement: "highlight" },
            { pattern: /\bemphasize\b/gi, replacement: "stress" },
            { pattern: /\bnavigate\b/gi, replacement: "handle" },
            { pattern: /\blandscape\b/gi, replacement: "world" },
            { pattern: /\btestament\b/gi, replacement: "proof" },
            { pattern: /\bin conclusion\b/gi, replacement: "basically" },
            { pattern: /\bto start with\b/gi, replacement: "first off" },
            { pattern: /\bgame-changer\b/gi, replacement: "huge deal" },
            { pattern: /\bunleash\b/gi, replacement: "release" },
            { pattern: /\bfoster\b/gi, replacement: "build" },
            { pattern: /\bhone\b/gi, replacement: "sharpen" }
        ];

        let result = text;
        aiPhrases.forEach(({ pattern, replacement }) => {
            result = result.replace(pattern, replacement);
        });
        return result;
    }

    private applyColloquialisms(text: string): string {
        // Simple replacements to sound more spoken
        const replacements: Record<string, string> = {
            "cannot": "can't",
            "do not": "don't",
            "is not": "isn't",
            "are not": "aren't",
            "will not": "won't",
            "have not": "haven't",
            "should not": "shouldn't",
            "could not": "couldn't",
            "would not": "wouldn't",
            "it is": "it's",
            "that is": "that's",
            "what is": "what's",
            "going to": "gonna",
            "want to": "wanna",
            "kind of": "kinda",
            "sort of": "sorta",
            "let us": "let's",
            "however": "but",
            "consequently": "so",
            "therefore": "so",
            "in addition": "plus",
            "specifically": "mostly",
            "approximately": "about",
            "utilize": "use"
        };

        let result = text;
        for (const [formal, casual] of Object.entries(replacements)) {
            // Case insensitive replacement
            const regex = new RegExp(`\\b${formal}\\b`, 'gi');
            result = result.replace(regex, casual);
        }
        return result;
    }

    private applyHesitations(text: string): string {
        const words = text.split(" ");
        const hesitations = ["um,", "uh,", "well,", "like,", "you know,"];

        return words.map(word => {
            if (Math.random() < (this.config.hesitationRate || 0)) {
                const hesitation = hesitations[Math.floor(Math.random() * hesitations.length)];
                return `${hesitation} ${word}`;
            }
            return word;
        }).join(" ");
    }

    private applyTypos(text: string): string {
        return text.split("").map(char => {
            if (Math.random() < (this.config.typoRate || 0)) {
                return this.getNearbyKey(char);
            }
            return char;
        }).join("");
    }

    private getNearbyKey(char: string): string {
        const keyboard: Record<string, string> = {
            'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y', 'y': 'u', 'u': 'i', 'i': 'o', 'o': 'p', 'p': 'o',
            'a': 's', 's': 'd', 'd': 'f', 'f': 'g', 'g': 'h', 'h': 'j', 'j': 'k', 'k': 'l', 'l': 'k',
            'z': 'x', 'x': 'c', 'c': 'v', 'v': 'b', 'b': 'n', 'n': 'm', 'm': 'n'
        };
        const lower = char.toLowerCase();
        if (keyboard[lower]) {
            return char === lower ? keyboard[lower] : keyboard[lower].toUpperCase();
        }
        return char; // No nearby key found (e.g. symbols), return original
    }
}
