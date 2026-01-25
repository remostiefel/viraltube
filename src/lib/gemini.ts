import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPTS, PromptKey } from "./prompts";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to fill handlebars-style templates {{var}}
function fillTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
    });
}

export interface ChatMessage {
    role: "user" | "model";
    parts: string;
}

export async function sendChatMessage(history: ChatMessage[], message: string): Promise<string> {
    if (!apiKey) throw new Error("Gemini API Key is missing");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
        })),
        generationConfig: {
            maxOutputTokens: 4000,
        }
    });

    try {
        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Chat Error:", error);
        return "Neural Link Unstable. Please retry.";
    }
}

export interface VideoIdea {
    title: string;
    hook: string;
    angle: string;
    thumbnailIdea: string;
    visualData?: string;
}


export async function generateIdeasFromGemini(topic: string, constitution: string = "", format: "Shorts" | "Longform" = "Longform"): Promise<VideoIdea[]> {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (format === "Shorts") {
        prompt = `
        You are a Viral Shorts Strategist.
        Topic: "${topic}"
        
        ${constitution}
        
        Generate 3 high-octane 30-60s Short ideas.
        CRITICAL: 
        1. MUST include a "Visual Hook" (what we see in sec 0-3).
        2. Hook Text must be under 1 sentence.
        3. Thumbnail Idea = The specific frame to freeze on.
        
        Return JSON array: [{ title, hook, angle, thumbnailIdea, visualData: "Visual Hook Description" }]
        `;
    } else {
        prompt = `
        You are a YouTube viral strategist for a channel called "NEURO-CODE". 
        
        ${constitution}
        
        Generate 3 viral video ideas for the topic: "${topic}".
        Return the response as a valid JSON array of objects with keys: title, hook, angle, thumbnailIdea. 
        Do not wrap in markdown code blocks. Just the raw JSON string.
        `;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as VideoIdea[];
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return [];
    }
}

export interface OptimizationResult {
    original: string;
    score: number;
    variations: Array<{
        title: string;
        score: number;
        reasoning: string;
    }>;
    analysis: string;
}

export async function optimizeTitleWithGemini(currentTitle: string): Promise<OptimizationResult> {
    if (!apiKey) throw new Error("Gemini API Key is missing");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this YouTube video title: "${currentTitle}"
      Return JSON format: { "original": "${currentTitle}", "score": number, "variations": [{ "title": "...", "score": number, "reasoning": "..." }], "analysis": "Short critique" }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as OptimizationResult;
    } catch (error) {
        return { original: currentTitle, score: 0, variations: [], analysis: "Failed to optimize." };
    }
}

export interface Blueprint {
    original: {
        hook: string;
        structure: string[];
        geniusElements: string[];
        twist: string;
    };
    adaptation: {
        hook: string;
        structure: string[];
        differentiation: string[];
        germanTwist: string;
        culturalAdjustments: string;
    };
    analysis: string;
}

export interface StrategyProfile {
    niche: string;
    language: "DE" | "EN";
    tone: "hype" | "substance" | "balanced";
    emulationMode: "translate" | "adapt" | "innovate";
    contentDepth: number;
    perfectLoop?: boolean; // New: Infinite Recursion Mode
    durationConstraint?: "30s" | "60s" | "long";
    metaNarrative?: boolean; // New: Origin Story / Process integration
}

const DEFAULT_PROFILE: StrategyProfile = {
    niche: "Biohacking",
    language: "DE",
    tone: "balanced",
    emulationMode: "adapt",
    contentDepth: 70,
    perfectLoop: false,
    durationConstraint: "long",
    metaNarrative: false
};

export async function generateBlueprint(
    transcript: string,
    targetTopic: string,
    targetLanguage: "DE" | "EN" = "DE",
    profile: StrategyProfile = DEFAULT_PROFILE,
    promptOverrides?: Record<string, string>
): Promise<Blueprint> {
    if (!apiKey) throw new Error("Gemini API Key is missing");

    const safeTranscript = transcript.slice(0, 25000);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const toneInstruction = {
        "hype": "Style: High Energy, Fast Paced, MrBeast-like retention editing.",
        "balanced": "Style: Engaging but substantive. Modern Wisdom style.",
        "substance": "Style: Authoritative, Deep, Slow. Andrew Huberman style."
    }[profile.tone];

    const modeInstruction = {
        "translate": "Strategy: Direct Translation of the viral concept.",
        "adapt": "Strategy: Cultural Adaptation (keep the core, change the framing).",
        "innovate": "Strategy: Innovation (use the structure but change the content completely)."
    }[profile.emulationMode];

    // Use override or default
    const template = promptOverrides?.["blueprint"] || SYSTEM_PROMPTS.blueprint.template;

    const prompt = fillTemplate(template, {
        niche: profile.niche,
        toneInstruction,
        modeInstruction,
        contentDepth: profile.contentDepth,
        transcript: safeTranscript,
        targetTopic,
        targetLanguage
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as Blueprint;
    } catch (error) {
        console.error("Blueprint Generation Error", error);
        return {
            original: { hook: "Analysis Failed", structure: [], geniusElements: [], twist: "" },
            adaptation: { hook: "Manual Creation Required", structure: [], differentiation: [], germanTwist: "", culturalAdjustments: "" },
            analysis: "AI could not process transcript."
        };
    }
}

export interface ScienceShort {
    hook: string;
    coreFact: string;
    explanation: string;
    visualIdea: string;
    citation: string;
    voiceOver?: string; // Full VoiceOver text (German)
    formattedScript?: string; // Formatted script with emojis etc.
}

export async function simplifyScience(
    abstract: string,
    title: string,
    profile: StrategyProfile = DEFAULT_PROFILE,
    promptOverrides?: Record<string, string>
): Promise<ScienceShort> {
    if (!apiKey) throw new Error("Gemini API Key is missing");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const toneInstruction = {
        "hype": "Make it SHOCKING. Use fear or extreme curiosity.",
        "balanced": "Make it intriguing but accurate.",
        "substance": "Make it highly educational and precise."
    }[profile.tone];

    const template = promptOverrides?.["science"] || SYSTEM_PROMPTS.science.template;

    const prompt = fillTemplate(template, {
        niche: profile.niche,
        audienceLanguage: profile.language === "DE" ? "German Speaking" : "English Speaking",
        targetLanguage: profile.language,
        toneInstruction,
        title,
        abstract: abstract.slice(0, 5000)
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as ScienceShort;
    } catch (error) {
        console.error("Science Simplification Error", error);
        return {
            hook: "Error processing paper",
            coreFact: "",
            explanation: "",
            visualIdea: "",
            citation: "",
            voiceOver: "Generation Failed",
            formattedScript: ""
        };
    }
}

export interface PrognosisRequest {
    currentProfile: StrategyProfile;
    metrics: {
        avgViews: number;
        retention: number;
        ctr: number;
        totalVideos: number;
    };
    promptOverrides?: Record<string, string>;
}

export interface PrognosisResult {
    analysis: string;
    suggestion: string;
    proposedProfile: StrategyProfile;
}

export async function generatePrognosis(data: PrognosisRequest): Promise<PrognosisResult> {
    if (!apiKey) throw new Error("Gemini API Key is missing");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const template = data.promptOverrides?.["prognosis"] || SYSTEM_PROMPTS.prognosis.template;

    const prompt = fillTemplate(template, {
        tone: data.currentProfile.tone,
        niche: data.currentProfile.niche,
        depth: data.currentProfile.contentDepth,
        views: data.metrics.avgViews,
        retention: data.metrics.retention,
        ctr: data.metrics.ctr,
        language: data.currentProfile.language
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as PrognosisResult;
    } catch (error) {
        console.error("Prognosis Error", error);
        return {
            analysis: "Analysis systems offline.",
            suggestion: "Keep current course.",
            proposedProfile: data.currentProfile
        };
    }
}

export async function synthesizeStrategy(inputs: string): Promise<string> {
    if (!apiKey) throw new Error("Gemini API Key is missing");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a Master Content Strategist.
    Analyze the following "Fusion Inputs" (a list of viral video data/prompts):

    ${inputs}

    TASK: Reverse-engineer the underlying STRATEGY that makes these videos successful. 
    Do NOT just summarize the content. Extract the FORMAT.

    Return the result as a Markdown checklist ready for a "Strategy Pad".
    Structure:
    # ⚔️ Master Strategy: [Name of Strategy]

    ## 1. The Hook Formula
    - (Specific trigger or opening line structure)

    ## 2. Pacing & Structure
    - (How the narrative unfolds)

    ## 3. Visual Identity
    - (Key visual elements/style)

    ## 4. Psychology (Neuro-Code)
    - (Why this triggers dopamine/retention)

    Keep it actionable and concise.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Strategy Synthesis Error", error);
        return "# Error\nCould not synthesize strategy. Please try again.";
    }
}

export interface LoopAssets {
    musicPrompts: Array<{
        style: string;
        prompt: string;
        bpm: number;
    }>;
    imagePrompts: Array<{
        scene: string;
        midjourney: string;
    }>;
    videoPrompts: Array<{
        action: string;
        runway: string;
    }>;
}

export async function generateViralLoopAssets(
    title: string,
    description: string,
    blueprintContext: string
): Promise<LoopAssets> {
    if (!apiKey) throw new Error("Gemini API Key is missing");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a CORTEX Asset Engineer.
    Project: "${title}"
    Context: "${description}"
    Blueprint Summary: "${blueprintContext.slice(0, 500)}..."

    TASK: Generate a "Production Asset Manifest" for a 30s Viral Loop Short.
    Quality Level: S-Tier (Midjourney v6, Runway Gen-3, Suno v3).

    REQUIREMENTS:
    1. **Music (3 Options)**:
       - 1x High Energy / Phonk / Drift
       - 1x Atmospheric / Tension / Ambient
       - 1x Viral Trend Style (e.g. "Sigma", "CoreCore")
       - Format for Suno/Udio (Style description, BPM).

    2. **Images (10 Keyframes)**:
       - High aesthetic value. 9:16 aspect ratio (--ar 9:16).
       - Style: Cinematic, Photorealistic, 8k.
       - Provide the raw Midjourney prompt.

    3. **Video (10 Motion Clips)**:
       - 3-5s loops.
       - Describe motion clearly for Runway Gen-3/Pika.
       - e.g. "Slow zoom into neural network," "Cyberpunk city flyover".

    RETURN JSON ONLY:
    {
      "musicPrompts": [{ "style": "...", "prompt": "...", "bpm": 120 }],
      "imagePrompts": [{ "scene": "...", "midjourney": "/imagine prompt: ..." }],
      "videoPrompts": [{ "action": "...", "runway": "..." }]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text) as LoopAssets;
    } catch (error) {
        console.error("Asset Generation Error", error);
        return {
            musicPrompts: [],
            imagePrompts: [],
            videoPrompts: []
        };
    }
}

export async function generateSpeechWithGemini(
    text: string,
    voiceName: string = "Algieba", // Default per user request
    speakingRate: number = 1.0,
    temperature: number = 1.55       // Default per user request
): Promise<string | null> {
    if (!apiKey) throw new Error("Gemini API Key is missing");

    // NOTE: This implementation targets the Standard Google TTS endpoint.
    // If "Algieba" is a specific Gemini Audio model voice, this might need
    // to target the `generativelanguage.googleapis.com` endpoint with audio modality.
    // For now, we prepare the payload as requested.

    const endpoint = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;

    const languageCode = voiceName.includes("-") ? voiceName.split("-").slice(0, 2).join("-") : "en-US";

    const body = {
        input: { text },
        voice: {
            languageCode,
            name: voiceName
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: speakingRate
            // Standard TTS does not support 'temperature' or 'style_instructions' directly in this payload.
            // If the user is using the experimental Audio Generation API, the endpoint would be different.
            // We are keeping this parameter in the function signature for future connection.
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Google TTS API Error:", error);

            // Fallback: If Algieba fails (likely), try standard Journey voice
            if (voiceName === "Algieba") {
                console.warn("Retrying with fallback voice 'en-US-Journey-F'...");
                return generateSpeechWithGemini(text, "en-US-Journey-F", speakingRate, temperature);
            }
            return null;
        }

        const data = await response.json();
        return data.audioContent; // Base64 string
    } catch (error) {
        console.error("Voice Generation Error:", error);
        return null;
    }
}
