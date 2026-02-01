import OpenAI from "openai";
import { SYSTEM_PROMPTS } from "@/lib/prompts";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface YoutubeOptimizerResult {
    filename?: {
        primary: string;
        alternatives: string[];
        reasoning: string;
    };
    title?: {
        primary: string;
        alternatives: string[];
        psychology: string;
    };
    description?: {
        description: string;
    };
    tags?: {
        tags: string;
        strategy: string;
    };
}

export async function generateOptimization(
    script: string,
    type: 'all' | 'filename' | 'title' | 'description' | 'tags'
): Promise<YoutubeOptimizerResult | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const basePrompt = SYSTEM_PROMPTS.youtube_optimizer.template;

    let promptInstruction = "";

    if (type === 'all') {
        promptInstruction = `
      TASK: Execute ALL sub-prompts (1, 2, 3, 4).
      Return a single JSON object with keys: "filename", "title", "description", "tags".
      Each key must contain the specific JSON structure defined in the sub-prompts.
    `;
    } else if (type === 'filename') {
        promptInstruction = `
      TASK: Execute ONLY PROMPT 1 (DATEINAME).
      Return JSON: { "filename": { "primary": "...", "alternatives": [...], "reasoning": "..." } }
    `;
    } else if (type === 'title') {
        promptInstruction = `
      TASK: Execute ONLY PROMPT 2 (TITEL).
      Return JSON: { "title": { "primary": "...", "alternatives": [...], "psychology": "..." } }
    `;
    } else if (type === 'description') {
        promptInstruction = `
      TASK: Execute ONLY PROMPT 3 (BESCHREIBUNG).
      Return JSON: { "description": { "description": "..." } }
    `;
    } else if (type === 'tags') {
        promptInstruction = `
      TASK: Execute ONLY PROMPT 4 (TAGS).
      Return JSON: { "tags": { "tags": "...", "strategy": "..." } }
    `;
    }

    const systemPrompt = `
    ${basePrompt}

    ${promptInstruction}
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Here is the Script to optimize:\n\n${script}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as YoutubeOptimizerResult;

    } catch (error) {
        console.error("YouTube Optimizer Error:", error);
        return null;
    }
}
