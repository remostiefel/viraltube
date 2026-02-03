"use server";

import { generateScriptWithOpenAI, GeneratedScript, generateImagePrompts, ImagePrompt, generateAudioPrompts, AudioPrompt, generateImageWithOpenAI, refineScriptWithOpenAI, extendScriptWithOpenAI, condenseScriptWithOpenAI, generateVideoPrompts, VideoPrompt, generateScriptImagePrompts, ScriptImagePrompt } from "@/lib/openai";
import { generateBlueprint, Blueprint, simplifyScience, ScienceShort, StrategyProfile, generateIdeasFromGemini, VideoIdea, generateSpeechWithGemini, generateVoiceoverStyle } from "@/lib/gemini";
import { LearningService } from "@/app/cortex/learning/LearningService";
import { analyzeScript } from "@/lib/script-optimizer";
import { getVideoTranscript, getVideoMetadata, OutlierVideo } from "@/lib/youtube";

// --- Script Generation ---
export async function generateScriptAction(topic: string, language: "DE" | "EN" = "DE", strategyContext?: string, perfectLoop?: boolean, duration?: "30s" | "60s" | "long", metaNarrative?: boolean, protocol?: string, formatId?: string, evidenceBlob?: string): Promise<GeneratedScript | null> {

    // Inject Learned Patterns
    const learnedContext = await LearningService.getOptimizationContext();
    const effectiveContext = strategyContext ? `${strategyContext}\n\n${learnedContext}` : learnedContext;

    const script = await generateScriptWithOpenAI(topic, "High-Performance Authority", language, effectiveContext, perfectLoop, formatId, metaNarrative, protocol, evidenceBlob);

    if (script) {
        try {
            const fullText = script.sections.map(s => s.content).join(" ");
            const analysis = await analyzeScript(fullText);
            script.analysis = analysis;
        } catch (e) {
            console.error("Post-Generation Analysis Failed", e);
            // We return the script anyway, analysis is optional
        }
    }

    return script;
}

export async function refineScriptAction(currentScript: string, strategyContext: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await refineScriptWithOpenAI(currentScript, strategyContext, language);
}

export async function extendScriptAction(currentScript: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await extendScriptWithOpenAI(currentScript, language);
}

export async function condenseScriptAction(currentScript: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await condenseScriptWithOpenAI(currentScript, language);
}

// --- Asset Generation ---
export async function generateImagePromptsAction(scene: string): Promise<ImagePrompt[]> {
    return await generateImagePrompts(scene);
}

export async function generateImageAction(prompt: string): Promise<string | null> {
    return await generateImageWithOpenAI(prompt);
}

export async function generateAudioPromptsAction(context: string): Promise<AudioPrompt | null> {
    return await generateAudioPrompts(context);
}

export async function generateVideoPromptsAction(scriptContent: string, targetCount: number = 8): Promise<VideoPrompt[]> {
    return await generateVideoPrompts(scriptContent, targetCount);
}

export async function generateScriptImagePromptsAction(scriptContent: string): Promise<ScriptImagePrompt[]> {
    return await generateScriptImagePrompts(scriptContent);
}

export async function generateVoiceoverStyleAction(scriptContent: string): Promise<string> {
    return await generateVoiceoverStyle(scriptContent);
}

export async function generateSpeechAction(text: string, voice: string, speed: number, temperature: number = 1.55): Promise<string | null> {
    return await generateSpeechWithGemini(text, voice, speed, temperature);
}


// --- Ideation & Blueprint ---
export async function generateVideoIdeas(topic: string): Promise<VideoIdea[]> {
    const { getViralConstitution } = await import("@/lib/openai");
    const constitution = await getViralConstitution();
    return await generateIdeasFromGemini(topic, constitution);
}

export async function researchViralIdeasAction(): Promise<VideoIdea[]> {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error("API Key Missing");

        // 1. Defined Search Queries for the Niche
        const queries = [
            "Neuroscience Hacks",
            "Dopamine Detox",
            "Andrew Huberman Summary",
            "Subconscious Mind Tricks",
            "Psychology Tricks to control"
        ];

        // 2. Randomly select 2 queries to keep it fresh but fast
        const selectedQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 2);

        let allOutliers: OutlierVideo[] = [];

        // 3. Search for Outliers
        const { searchOutliers } = await import("@/lib/youtube");

        for (const q of selectedQueries) {
            try {
                // Gap Mode ON to find high demand stuff
                const results = await searchOutliers(q, apiKey, undefined, undefined, true);
                allOutliers = [...allOutliers, ...results];
            } catch (e) {
                console.error(`Search failed for ${q}`, e);
            }
        }

        // 4. Extract Titles
        const uniqueTitles = Array.from(new Set(allOutliers.map(v => v.title))).slice(0, 10);

        if (uniqueTitles.length === 0) return [];

        // 5. Generate Ideas
        const { generateTrendBasedIdeas } = await import("@/lib/gemini");
        return await generateTrendBasedIdeas(uniqueTitles);

    } catch (e) {
        console.error("Research Action Failed", e);
        return [];
    }
}

export async function generateBlueprintAction(
    videoId: string,
    targetTopic: string,
    language: "DE" | "EN" = "DE",
    profile?: StrategyProfile,
    overrides?: Record<string, string>
): Promise<Blueprint> {
    let contextContent = await getVideoTranscript(videoId);

    if (!contextContent) {
        // Fallback: Try Metadata
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            const metadata = await getVideoMetadata(videoId, apiKey);
            if (metadata) {
                contextContent = `[NOTE: TRANSCRIPT UNAVAILABLE - ANALYZING METADATA]\n\nVIDEO TITLE: ${metadata.title}\n\nVIDEO DESCRIPTION:\n${metadata.description}`;
            }
        }
    }

    if (!contextContent) {
        throw new Error("Transcripts disabled or unavailable for this video.");
    }
    return await generateBlueprint(contextContent, targetTopic, language, profile, overrides);
}


export async function synthesizePaperAction(
    abstract: string,
    title: string,
    profile?: StrategyProfile,
    overrides?: Record<string, string>
): Promise<ScienceShort> {
    return await simplifyScience(abstract, title, profile, overrides);
}

export async function harvestWisdomAction(scriptContent: string, projectId: string | null = null) {
    // Lazy load to avoid circular deps
    const { extractWisdomFromScript } = await import("@/lib/openai");
    const { saveTemplate } = await import("@/lib/templates");

    const nuggets = await extractWisdomFromScript(scriptContent);

    if (nuggets && nuggets.length > 0) {
        // Save each nugget as a template
        for (const nugget of nuggets) {
            const title = nugget.universalLaw ? `⚖️ ${nugget.universalLaw}` : `💡 ${nugget.principle.substring(0, 30)}...`;

            await saveTemplate({
                type: "viral-wisdom",
                name: title,
                content: [nugget], // Store as array for compatibility
                wisdomCategory: nugget.type,
                projectId: projectId || undefined,
                tags: ["Auto-Harvested"]
            });
        }
        return nuggets.length;
    }
    return 0;
}
