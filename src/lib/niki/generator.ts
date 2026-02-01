
import OpenAI from "openai";
import { Humanizer, HumanizationConfig } from "./humanizer";
import { LOOP_30S_PROMPT, NIKI_PERSONAS } from "./prompts";

export interface NikiOptions {
    topic: string;
    persona?: keyof typeof NIKI_PERSONAS;
    humanizationConfig?: HumanizationConfig;
}

export interface NikiScript {
    rawScript: string;
    humanizedScript: string;
    personaUsed: string;
    metadata: {
        wordCount: number;
        estimatedDuration: string;
    };
}

export class NikiGenerator {
    private humanizer: Humanizer;
    private openai: OpenAI | null = null;

    constructor(config?: HumanizationConfig) {
        this.humanizer = new Humanizer(config);
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
    }

    public async generate30sLoop(options: NikiOptions): Promise<NikiScript | null> {
        if (!this.openai) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey) {
                this.openai = new OpenAI({ apiKey });
            } else {
                console.error("OpenAI API Key missing");
                return null;
            }
        }

        const openai = this.openai;

        const personaKey = options.persona || "DEFAULT";
        const personaPrompt = NIKI_PERSONAS[personaKey];

        // Construct the full prompt
        const prompt = LOOP_30S_PROMPT
            .replace("{topic}", options.topic)
            .replace("{persona}", personaPrompt);

        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are Niki, a generator of ultra-realistic, human-sounding 30s Shorts." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o",
                temperature: 0.8, // Slightly higher for creativity/natural feel
            });

            const content = completion.choices[0].message.content;
            if (!content) return null;

            // Clean up: remove quotes if present
            const cleanRaw = content.replace(/^["']|["']$/g, '').trim();

            // Apply Humanization
            const humanized = this.humanizer.humanize(cleanRaw);

            // Calculate metadata
            const wordCount = humanized.split(/\s+/).length;
            const duration = Math.ceil(wordCount / 2.5) + "s"; // Approx 150wpm = 2.5 w/s

            return {
                rawScript: cleanRaw,
                humanizedScript: humanized,
                personaUsed: personaKey,
                metadata: {
                    wordCount,
                    estimatedDuration: duration
                }
            };

        } catch (error) {
            console.error("Niki Generation Error:", error);
            return null;
        }
    }
}
