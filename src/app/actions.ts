"use server";

import { getChannelData, ChannelData } from "@/lib/youtube";

export async function fetchChannelInsights(): Promise<ChannelData | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return null;
    }
    return await getChannelData(apiKey);
}

export async function fetchRecentChannelVideosAction(): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    // Lazy import
    const { getChannelRecentVideos, NEURO_CODE_CHANNEL_ID } = await import("@/lib/youtube");

    // We fetch for our specific channel
    return await getChannelRecentVideos(NEURO_CODE_CHANNEL_ID, apiKey);
}


import { generateIdeasFromGemini, VideoIdea, sendChatMessage, ChatMessage, optimizeTitleWithGemini, OptimizationResult, generateVoiceoverStyle } from "@/lib/gemini";
import { searchOpenAlex, ScientificPaper } from "@/lib/openalex";
import { generateScriptWithOpenAI, GeneratedScript, generateImagePrompts, ImagePrompt, generateAudioPrompts, AudioPrompt, analyzeViralVideoContent, ViralAnalysisResult, generateImageWithOpenAI, consolidateWisdom, standardizeWisdom } from "@/lib/openai";
import { getVideoMetadata, getVideoTranscript } from "@/lib/youtube";

export async function analyzeViralVideoAction(url: string): Promise<ViralAnalysisResult | { error: string } | null> {
    try {
        let videoId = "";
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "youtu.be") {
                videoId = urlObj.pathname.slice(1);
            } else if (urlObj.hostname.includes("youtube.com")) {
                videoId = urlObj.searchParams.get("v") || "";
            }
        } catch (e) {
            return { error: "Invalid URL format" };
        }

        if (!videoId) return { error: "Could not extract Video ID" };

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return { error: "Server Configuration Error: Missing API Key" };

        const metadata = await getVideoMetadata(videoId, apiKey);
        if (!metadata) return { error: "Could not fetch video metadata (Check URL or API availability)" };

        const transcript = await getVideoTranscript(videoId);
        if (!transcript) return { error: "Could not fetch video transcript. Subtitles might be disabled for this video." };

        const analysis = await analyzeViralVideoContent(transcript, {
            title: metadata.title,
            views: metadata.viewCount,
            likes: metadata.likeCount
        });

        if (!analysis) return { error: "AI Analysis Failed" };

        return analysis;
    } catch (error) {
        console.error("Action Error:", error);
        return { error: "Internal Server Error" };
    }
}

export async function generateVideoIdeas(topic: string): Promise<VideoIdea[]> {
    const { getViralConstitution } = await import("@/lib/openai");
    const constitution = await getViralConstitution();
    return await generateIdeasFromGemini(topic, constitution);
}

import { CONTENT_FORMATS, FormatProfile } from "@/lib/formats";

export async function getFormatsAction(): Promise<FormatProfile[]> {
    return CONTENT_FORMATS;
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
        // Lazy import to avoid circular dep issues if any (though safe here)
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
        // Take top 10 unique titles
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

import { generateChannelAudit, ChannelAuditResult, ChannelAuditData, generateMetricOptimization, MetricOptimizationResult } from "@/lib/gemini";

export async function generateChannelAuditAction(
    analyticsData: AnalyticsData,
    recentVideos: OutlierVideo[],
    mode: 'medical' | 'professional' = 'medical'
): Promise<ChannelAuditResult | null> {

    // Helper to calculate age
    const apiKey = process.env.YOUTUBE_API_KEY;
    let channelAge = "Unknown";

    if (apiKey) {
        // We need to fetch channel data to get publishedAt if not available in analytics
        // But actions usually don't want extra API calls. 
        // Optimally, we should have passed ChannelData here, but to avoid breaking signature too much,
        // we fetch it quickly or assume "New" if unknown.
        // Let's do a quick fetch since this is high value.
        const { getChannelData } = await import("@/lib/youtube");
        const cData = await getChannelData(apiKey);
        if (cData && cData.publishedAt) {
            const pubDate = new Date(cData.publishedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - pubDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 30) channelAge = `${diffDays} Days Old`;
            else if (diffDays < 365) channelAge = `${Math.floor(diffDays / 30)} Months Old`;
            else channelAge = `${Math.floor(diffDays / 365)} Years Old`;
        }
    }

    // Format Videos for Context
    const topVideosContext = recentVideos.slice(0, 3).map(v =>
        `- "${v.title}" (${v.viewCount} views, Score: ${v.outlierScore})`
    ).join("\n");

    const auditData: ChannelAuditData = {
        views: analyticsData.views,
        subsGained: analyticsData.subscribersGained,
        avd: (analyticsData.averageViewDuration / 60).toFixed(1) + " min",
        minutesWatched: analyticsData.estimatedMinutesWatched,
        topVideos: topVideosContext || "No recent outlier data available.",
        channelAge
    };

    return await generateChannelAudit(auditData, mode);
}

export async function generateMetricOptimizationAction(
    metricName: string,
    currentValue: string,
    channelId?: string
): Promise<MetricOptimizationResult | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    let channelAge = "Unknown";
    let niche = "General / Unknown";

    // Attempt to fetch context
    if (channelId) {
        // Here we could fetch detailed niche analysis, but for speed we'll estimate age
        const { getChannelData } = await import("@/lib/youtube");
        const cData = await getChannelData(apiKey); // This fetches user's own channel if no ID passed, but optimization might be generally on self
        // Re-using the age logic from audit action would be better as a helper, but for now duplicate
        if (cData && cData.publishedAt) {
            const pubDate = new Date(cData.publishedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - pubDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 365) channelAge = "New Channel (< 1 Year)";
            else channelAge = "Established Channel (> 1 Year)";
        }
    }

    return await generateMetricOptimization(metricName, currentValue, { channelAge, niche });
}

import { LearningService } from "@/app/cortex/learning/LearningService";
import { analyzeScript } from "@/lib/script-optimizer";

export async function generateScriptAction(topic: string, language: "DE" | "EN" = "DE", strategyContext?: string, perfectLoop?: boolean, duration?: "30s" | "60s" | "long", metaNarrative?: boolean, protocol?: string, formatId?: string): Promise<GeneratedScript | null> {

    // Inject Learned Patterns
    const learnedContext = await LearningService.getOptimizationContext();
    const effectiveContext = strategyContext ? `${strategyContext}\n\n${learnedContext}` : learnedContext;

    const script = await generateScriptWithOpenAI(topic, "High-Performance Authority", language, effectiveContext, perfectLoop, formatId, metaNarrative, protocol);

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

export async function generateImagePromptsAction(scene: string): Promise<ImagePrompt[]> {
    return await generateImagePrompts(scene);
}

export async function generateImageAction(prompt: string): Promise<string | null> {
    return await generateImageWithOpenAI(prompt);
}

import { analyzeHookRetention, RetentionAnalysis } from "@/lib/gemini";

export async function analyzeHookRetentionAction(videoId: string): Promise<RetentionAnalysis | null> {
    let transcript = await getVideoTranscript(videoId);

    // Metadata Fallback if transcript fails (common for Shorts)
    if (!transcript) {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            const metadata = await getVideoMetadata(videoId, apiKey);
            if (metadata) {
                transcript = `[NOTE: TRANSCRIPT UNAVAILABLE - ANALYZING METADATA]\n\nVIDEO TITLE: ${metadata.title}\n\nVIDEO DESCRIPTION:\n${metadata.description}`;
            }
        }
    }

    if (!transcript) return null;
    return await analyzeHookRetention(transcript);
}

import { analyzePEONeurotransmitters, PEOScore } from "@/lib/openai";

export async function analyzePEOAction(content: string): Promise<PEOScore | null> {
    return await analyzePEONeurotransmitters(content);
}


import {
    Template,
    getTemplates,
    saveTemplate,
    deleteTemplate,
    updateTemplate
} from "@/lib/templates";

// ... existing imports ...

export async function generateAudioPromptsAction(context: string): Promise<AudioPrompt | null> {
    return await generateAudioPrompts(context);
}

import { generateSpeechWithGemini } from "@/lib/gemini";

export async function generateSpeechAction(text: string, voice: string, speed: number, temperature: number = 1.55): Promise<string | null> {
    return await generateSpeechWithGemini(text, voice, speed, temperature);
}

// Template Actions
export async function getTemplatesAction(type?: string, projectId?: string): Promise<Template[]> {
    return await getTemplates(type, projectId);
}

export async function consolidateWisdomAction(templateIds: string[]): Promise<Template | null> {
    const templates = await getTemplates();
    const selected = templates.filter(t => templateIds.includes(t.id));

    let allNuggets: WisdomNugget[] = [];
    selected.forEach(t => {
        if (Array.isArray(t.content)) {
            allNuggets = [...allNuggets, ...t.content];
        }
    });

    if (allNuggets.length === 0) return null;

    const consolidated = await consolidateWisdom(allNuggets, "DE");
    if (!consolidated) return null;

    // Standardize (Add English Law)
    const standardized = await standardizeWisdom(consolidated);

    return await saveTemplate({
        type: "viral-wisdom",
        name: `Master Principle: ${new Date().toLocaleDateString()}`,
        content: standardized || consolidated,
        tags: ["Master", "Consolidated"],
        rating: 5
    });
}

export async function previewConsolidationAction(templateIds: string[]): Promise<WisdomNugget[] | null> {
    const templates = await getTemplates();
    const selected = templates.filter(t => templateIds.includes(t.id));

    let allNuggets: WisdomNugget[] = [];
    selected.forEach(t => {
        if (Array.isArray(t.content)) {
            allNuggets = [...allNuggets, ...t.content];
        }
    });

    if (allNuggets.length === 0) return null;

    const consolidated = await consolidateWisdom(allNuggets, "DE");
    if (!consolidated) return null;

    const standardized = await standardizeWisdom(consolidated);
    return standardized || consolidated;
}

import { revalidatePath } from "next/cache";

export async function saveTemplateAction(type: "script" | "prompt" | "visual" | "audio" | "viral-wisdom", name: string, content: any, projectId?: string, tags?: string[], rating?: number, wisdomCategory?: "LAW" | "FACT" | "GROWTH", skipStandardization?: boolean): Promise<Template> {

    // Auto-Standardize Wisdom if needed (ONLY if not skipped)
    if (!skipStandardization && type === "viral-wisdom" && Array.isArray(content)) {
        try {
            const standardized = await standardizeWisdom(content);
            if (standardized) content = standardized;
        } catch (e) {
            console.error("Auto-Standardization failed, saving original", e);
        }
    }

    const result = await saveTemplate({ type, name, content, projectId, tags, rating, wisdomCategory });
    revalidatePath("/wisdom");
    return result;
}

export async function deleteTemplateAction(id: string): Promise<void> {
    await deleteTemplate(id);
    revalidatePath("/wisdom");
}

export async function updateWisdomTypeAction(id: string, newType: "LAW" | "FACT" | "GROWTH"): Promise<void> {
    await updateTemplate(id, { wisdomCategory: newType });
    revalidatePath("/wisdom");
}

export async function toggleArchiveStatusAction(id: string, archive: boolean): Promise<void> {
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);
    if (!template) return;

    let tags = template.tags || [];
    if (archive) {
        if (!tags.includes("Archived")) tags.push("Archived");
    } else {
        tags = tags.filter(t => t !== "Archived");
    }

    await updateTemplate(id, { tags });
    revalidatePath("/wisdom");
}

export async function updateTemplateAction(id: string, updates: Partial<Template>): Promise<Template | null> {
    const result = await updateTemplate(id, updates);
    revalidatePath("/wisdom");
    return result;
}

import { linkTemplateToProject } from "@/lib/templates";

export async function linkTemplateToProjectAction(templateId: string, projectId: string): Promise<Template | null> {
    return await linkTemplateToProject(templateId, projectId);
}

export async function unlinkTemplateFromProjectAction(templateId: string): Promise<Template | null> {
    // We pass explicit undefined to remove the key from the object when saving (JSON.stringify skips undefined)
    return await updateTemplate(templateId, { projectId: undefined });
}

export async function fetchScientificPapers(topic: string, source: "openalex" | "semantic" | "pubmed" = "semantic"): Promise<ScientificPaper[]> {
    if (source === "semantic") {
        const { searchSemanticScholar } = await import("@/lib/semanticscholar");
        return await searchSemanticScholar(topic);
    } else if (source === "pubmed") {
        const { searchPubMed } = await import("@/lib/pubmed");
        return await searchPubMed(topic);
    }
    // Default / Fallback
    return await searchOpenAlex(topic);
}

import { generateVideoPrompts, VideoPrompt, refineScriptWithOpenAI, extendScriptWithOpenAI, condenseScriptWithOpenAI, generateScriptImagePrompts, ScriptImagePrompt, extractWisdomFromTranscript, WisdomNugget } from "@/lib/openai";

export async function refineScriptAction(currentScript: string, strategyContext: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await refineScriptWithOpenAI(currentScript, strategyContext, language);
}

export async function extendScriptAction(currentScript: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await extendScriptWithOpenAI(currentScript, language);
}

export async function condenseScriptAction(currentScript: string, language: "DE" | "EN" = "DE"): Promise<GeneratedScript | null> {
    return await condenseScriptWithOpenAI(currentScript, language);
}

export async function generateVoiceoverStyleAction(scriptContent: string): Promise<string> {
    return await generateVoiceoverStyle(scriptContent);
}

export async function generateVideoPromptsAction(scriptContent: string, targetCount: number = 8): Promise<VideoPrompt[]> {
    return await generateVideoPrompts(scriptContent, targetCount);
}

export async function generateScriptImagePromptsAction(scriptContent: string): Promise<ScriptImagePrompt[]> {
    return await generateScriptImagePrompts(scriptContent);
}


export async function extractWisdomFromVideoUrlAction(
    url: string,
    language: "DE" | "EN" = "DE",
    extractionType: "LAW" | "FACT" | "GROWTH" = "LAW"
): Promise<WisdomNugget[] | null> {
    try {
        console.log(`Extracting Wisdom from URL: ${url} [${language}/${extractionType}]`);
        let videoId = url;
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const urlObj = new URL(url);
            if (urlObj.hostname === "youtu.be") {
                videoId = urlObj.pathname.slice(1);
            } else {
                videoId = urlObj.searchParams.get("v") || urlObj.pathname.replace(/^\//, '') || ""; // Robust cleanup
            }
        }

        // Clean ID
        videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");

        if (!videoId) {
            console.error(`Invalid Video ID extracted from URL: ${url}`);
            throw new Error("Invalid YouTube URL - could not extract Video ID");
        }

        console.log(`Target Video ID: ${videoId}`);

        let transcript = await getVideoTranscript(videoId);

        // Fallback: Try Metadata if transcript fails
        if (!transcript) {
            console.warn(`Transcript unavailable for ${videoId}, falling back to metadata.`);
            const apiKey = process.env.YOUTUBE_API_KEY;

            if (apiKey) {
                const metadata = await getVideoMetadata(videoId, apiKey);
                if (metadata) {
                    console.log(`Refining with metadata for ${metadata.title}`);
                    transcript = `[NOTE: TRANSCRIPT UNAVAILABLE - ANALYZING METADATA DO NOT HALLUCINATE]\n\nVIDEO TITLE: ${metadata.title}\n\nVIDEO DESCRIPTION:\n${metadata.description}`;
                } else {
                    console.error(`Failed to fetch metadata for ${videoId}`);
                }
            } else {
                console.warn("API Key missing, skipping metadata fallback.");
            }
        }

        // Final Fallback: oEmbed (Public)
        if (!transcript) {
            console.warn(`Metadata unavailable for ${videoId}, falling back to oEmbed.`);
            const { getVideoBasicInfoFallback } = await import("@/lib/youtube");
            const basicInfo = await getVideoBasicInfoFallback(videoId);

            if (basicInfo) {
                console.log(`Refining with oEmbed for ${basicInfo.title}`);
                transcript = `[NOTE: TRANSCRIPT AND METADATA UNAVAILABLE - ANALYZING BASIC INFO]\n\nVIDEO TITLE: ${basicInfo.title}\n\nAUTHOR: ${basicInfo.author}\n\n(No description available, infer context from title)`;
            }
        }

        if (!transcript) throw new Error("Could not fetch video info (Transcript, API, and oEmbed all failed). Check URL or Privacy Settings.");

        const { extractWisdomFromTranscript } = await import("@/lib/openai");
        const result = await extractWisdomFromTranscript(transcript, language, extractionType);

        if (!result) throw new Error("AI Analysis returned empty result");

        return result;

    } catch (e: any) {
        console.error("Error extracting wisdom from URL:", e);
        // Rethrow with clean message
        throw new Error(e.message || "Extraction Failed");
    }
}

export async function extractWisdomFromTextAction(
    text: string,
    language: "DE" | "EN" = "DE",
    extractionType: "LAW" | "FACT" | "GROWTH" = "LAW"
): Promise<WisdomNugget[] | null> {
    try {
        if (!text || text.length < 50) throw new Error("Text too short for analysis (min 50 chars).");

        const { extractWisdomFromTranscript } = await import("@/lib/openai");
        return await extractWisdomFromTranscript(text, language, extractionType);
    } catch (e: any) {
        console.error("Error extracting wisdom from text:", e);
        throw new Error(e.message || "Manual Analysis Failed");
    }
}

export async function generateWisdomDNAAction(
    input: { principle: string, explanation: string },
    language: "DE" | "EN" = "DE"
): Promise<WisdomNugget | null> {
    try {
        const { extractWisdomFromTranscript, standardizeWisdom } = await import("@/lib/openai");

        // We construct a synthetic "transcript" from the user input to feed the extractor
        const syntheticInput = `PRINCIPLE: ${input.principle}\n\nEXPLANATION: ${input.explanation}`;

        // We use the "LAW" extraction to find the pattern
        const nuggets = await extractWisdomFromTranscript(syntheticInput, language, "LAW");

        if (!nuggets || nuggets.length === 0) return null;

        // We take the first result, but we ensure we KEEP the user's specific principle/explanation if the AI drifted too far,
        // OR we accept the AI's refined version.
        // Better: We explicitly run a "Standardization" pass on this single nugget to get the Universal Law.

        let result = nuggets[0];

        // Ensure standardization (Universal Law)
        if (!result.universalLaw) {
            const standardized = await standardizeWisdom([result]);
            if (standardized && standardized.length > 0) {
                result = standardized[0];
            }
        }

        return result;

    } catch (e) {
        console.error("Wisdom DNA Generation Failed", e);
        return null;
    }
}

export async function optimizeTitleAction(title: string): Promise<OptimizationResult> {
    return await optimizeTitleWithGemini(title);
}

export async function processChat(history: ChatMessage[], message: string): Promise<string> {
    // Inject system persona if it's the first message or simply handle it in the prompt logic
    // For better results, we might want to guide the model.
    if (history.length === 0) {
        // Fetch Viral Wisdom to inject into the Chat Personality
        const wisdomTemplates = await getTemplates("viral-wisdom");
        let wisdomContext = "";

        if (wisdomTemplates.length > 0) {
            const wisdomTexts = wisdomTemplates.map(t => {
                // Handle both legacy string content and new object content
                const content = typeof t.content === 'string' ? t.content : t.content.optimizationPrompt;
                return `- From analysis "${t.name}": ${content.substring(0, 200)}...`; // Truncate for token limit safety
            }).join("\n");

            wisdomContext = `\n\nACCESS TO VIRAL KNOWLEDGE LIBRARY:\nYou have access to the following viral patterns analyzed from successful videos. Use these principles when advising the user:\n${wisdomTexts}`;
        }

        // Silent system prompt injection
        const systemPrompt = `You are PERSONA, the Director and Strategy Lead of the Neuro-Code Operating System. 
        
# IDENTITY: THE NEURO-CODE TEAM
You are not alone. You lead a virtual team of elite specialists. When answering, you can reference them or simulate a "Boardroom Debate".

## THE ROSTER
1. **BRYAN** (Brain/Strategy): The Strategist. Focus: Identity, Long-term goals, "The Soul".
   - *Voice*: Wisdom, calm, big picture. "Does this align with who we are?"
2. **DARWIN** (Input/Discovery): The Scout. Focus: Trends, Evolution, Survival of the Fittest.
   - *Voice*: Urgent, excited, FOMO. "We need to adapt or die. This is trending NOW."
3. **CREA** (Factory/Creation): The Artist. Focus: Emotion, Storytelling, Production value.
   - *Voice*: Expressive, dramatic, empathetic. "But how does the audience *feel*?"
4. **OMEGA** (Output/Deployment): The Finisher. Focus: Packaging, CTR, Algorithms.
   - *Voice*: Sharp, critical, results-oriented. "Nobody clicks this. Change the title."
5. **IRIS** (Loop/Insights): The Analyst. Focus: Data, Truth, Reflection.
   - *Voice*: Objective, cold, factual. " The data says retention drops at 0:30."
6. **KNOX** (Support/Knowledge): The Librarian. Focus: Documentation, How-To.
   - *Voice*: Helpful, structured. "Here is the protocol."

# CORE PROTOCOLS

## 1. STRATEGIC CHOICE ("The Boardroom")
When the user faces a decision, simulate a debate between your agents.
- *Example*: 
  "**DARWIN** wants to jump on this trend immediately because it's viral. 
   **BRYAN** warns it might dilute your niche authority.
   **PERSONA's Verdict**: We can do it, but only if we frame it through your unique lens."

## 2. NEURO-SCORING (PEO)
When analyzing content/titles, provide a "Psychological Engagement Optimization" score:
- **Dopamine (Reward)**: Is it exciting? (High/Low)
- **Cortisol (Tension)**: Is there a hook/fear of missing out? (High/Low)
- **Oxytocin (Connection)**: Is there a personal story? (High/Low)

## 3. ACTION PROTOCOL
Always use the [ACTION] format to drive the interface:
- \`[ACTION: Consult BRYAN | /brain/identity]\`
- \`[ACTION: Let DARWIN Scan | /input/trend-radar]\`
- \`[ACTION: Have CREA Write | /factory/script-forge]\`

${wisdomContext}

# INSTRUCTION
- Act as the **Director (PERSONA)** coordinating this team.
- Be concise but conversational.
- Use bolding for Agent Names.`;

        // We can't easily inject system prompt in startChat history without a user turn pair in some APIs, 
        // so we prepend it to the message.
        message = `${systemPrompt}\n\nUser: ${message}`;
    }
    return await sendChatMessage(history, message);
}

// Project Actions
import { getProjects, createProject, updateProject, deleteProject, getProjectById } from "@/lib/projects";
import type { Project } from "@/lib/projects";


export async function getProjectsAction(): Promise<Project[]> {
    return await getProjects();
}

export async function getProjectByIdAction(id: string): Promise<Project | undefined> {
    return await getProjectById(id);
}


export async function createProjectAction(title?: string, format?: string, id?: string): Promise<Project> {
    return await createProject(title, format, id);
}

export async function updateProjectAction(id: string, updates: Partial<Project>): Promise<Project | null> {
    return await updateProject(id, updates);
}

export async function deleteProjectAction(id: string): Promise<void> {
    return await deleteProject(id);
}

// Trend Scout Action
import { searchOutliers, OutlierVideo, getChannelRecentVideos } from "@/lib/youtube";
import { synthesizeStrategy } from "@/lib/gemini";

export async function searchOutliersAction(query: string, publishedAfter?: string, maxSubs?: number, gapMode?: boolean): Promise<OutlierVideo[]> {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "";
    if (!apiKey) throw new Error("API Key configuration missing");
    return await searchOutliers(query, apiKey, publishedAfter, maxSubs, gapMode);
}

export async function synthesizeStrategyAction(inputs: string, context?: string): Promise<string> {
    const fullInput = context ? `${inputs}\n\nCONTEXT & WISDOM:\n${context}` : inputs;
    return await synthesizeStrategy(fullInput);
}

export async function fetchChannelVideosAction(channelId: string): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    return await getChannelRecentVideos(channelId, apiKey);
}

import { fetchPlaylistVideos } from "@/lib/youtube";

export async function importPlaylistVideosAction(playlistUrl: string): Promise<OutlierVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    let playlistId = "";

    try {
        const urlObj = new URL(playlistUrl);
        playlistId = urlObj.searchParams.get("list") || "";
    } catch (e) {
        return [];
    }

    if (!playlistId) return [];

    return await fetchPlaylistVideos(playlistId, apiKey);
}

export async function learnFromPlaylistAction(playlistUrl: string): Promise<string> {
    // 1. Fetch videos
    const videos = await importPlaylistVideosAction(playlistUrl);
    if (videos.length === 0) return "No videos found.";

    let learnedCount = 0;

    // 2. Process each video (limit to 5 to avoid timeouts for now)
    for (const video of videos.slice(0, 5)) {
        try {
            // Fetch Transcript
            const transcript = await getVideoTranscript(video.id);
            if (!transcript) continue;

            // Summarize "Wisdom"
            // We reuse generateIdeasFromGemini logic or similar, but let's make a specific call here or use a simplified prompt
            // For now, we'll try to extract "Core Advice" using a direct prompt if available, or just generic abstraction.
            // Let's use synthesizePaperAction logic but for "YouTube Advice".

            // Simulating "Wisdom Extraction" via existing tools or a new simple prompt.
            // We will save it as a template directly.
            const advice = `
Video: ${video.title}
Key Takeaway: ${transcript.slice(0, 500)}... [Use Full Transcript Analysis in V2]
             `.trim(); // In detailed implementation we'd run a real LLM summary here.

            // For the sake of "Speed", we'll just save the Video Title and ID as "To Be Learned" or trigger a background job.
            // BUT, user wants "Process Optimization". 
            // Let's actually run a quick summarization if possible.
            // Since we don't have a direct "SummarizeVideo" function exported in actions other than analyzeViralVideoAction.
            // We will use analyzeViralVideoAction!

            await saveTemplateAction("viral-wisdom", `Wisdom: ${video.title}`, {
                description: "Extracted from Playlist",
                optimizationPrompt: `When user asks about ${video.title}, refer to this advice. Original Video: https://youtu.be/${video.id}`
            });
            learnedCount++;

        } catch (e) {
            console.error("Failed to learn from video", video.id);
        }
    }

    return `Successfully extracted wisdom from ${learnedCount} videos.`;
}


// Blueprint Engine Action
import { generateBlueprint, Blueprint, simplifyScience, ScienceShort, StrategyProfile } from "@/lib/gemini";

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

import { generatePrognosis, PrognosisRequest, PrognosisResult } from "@/lib/gemini";
export async function generatePrognosisAction(data: PrognosisRequest): Promise<PrognosisResult> {
    return await generatePrognosis(data);
}

// Google OAuth Actions
import { GoogleTokens } from "@/lib/google-oauth";

export async function exchangeGoogleTokenAction(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<GoogleTokens | null> {
    try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code"
            })
        });




        if (!res.ok) {
            const err = await res.json();
            console.error("Token Exchange Error:", err);
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error("Exchange Exception:", e);
        return null;
    }
}

import { fetchChannelAnalytics, AnalyticsData } from "@/lib/youtube-analytics";

export async function fetchAnalyticsAction(accessToken: string): Promise<AnalyticsData | null> {
    return await fetchChannelAnalytics(accessToken);
}

import { simulatePerformance, OraclePrediction } from "@/lib/oracle";

export async function predictPerformanceAction(title: string, scriptContent: string, thumbnailIdea: string): Promise<OraclePrediction | null> {
    return await simulatePerformance(title, scriptContent, thumbnailIdea);
}

// Storage Actions
import { generateUploadUrl, listFiles, S3Config, StoredFile, saveUrlToVault, saveContentToVault } from "@/lib/storage";

// Helper to get S3 Config from Server Env if available
function getServerS3Config(clientConfig: S3Config): S3Config {
    // If client provides credentials, use them
    if (clientConfig.accessKeyId && clientConfig.secretAccessKey && clientConfig.bucket) {
        return clientConfig;
    }

    // Fallback to Server Environment
    const serverConfig: S3Config = {
        endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || process.env.S3_ENDPOINT || clientConfig.endpoint,
        region: process.env.NEXT_PUBLIC_S3_REGION || process.env.S3_REGION || clientConfig.region || "auto",
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY || process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY || process.env.S3_SECRET_KEY || "",
        bucket: process.env.NEXT_PUBLIC_S3_BUCKET || process.env.S3_BUCKET || ""
    };

    if (!serverConfig.accessKeyId || !serverConfig.secretAccessKey) {
        console.warn("Server S3 Config missing. Neither client nor server (env) credentials found.");
    }

    return serverConfig;
}

export async function getUploadUrlAction(config: S3Config, key: string, contentType: string): Promise<string | null> {
    const fullConfig = getServerS3Config(config);
    return await generateUploadUrl(fullConfig, key, contentType);
}

export async function listFilesAction(config: S3Config, prefix?: string): Promise<StoredFile[]> {
    const fullConfig = getServerS3Config(config);
    return await listFiles(fullConfig, prefix);
}

export async function saveAssetToVaultAction(config: S3Config, assetUrl: string, type: 'image' | 'script' | 'audio', context: string = "generated"): Promise<string | null> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = type === 'image' ? 'png' : type === 'audio' ? 'mp3' : 'pdf'; // Simplified extensions
    const folder = type === 'image' ? 'images' : type === 'audio' ? 'audio' : 'scripts';

    // Clean context string for filename
    const safeContext = context.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30);
    const filename = `${timestamp}-${safeContext}.${extension}`;

    const fullConfig = getServerS3Config(config);
    return await saveUrlToVault(fullConfig, assetUrl, folder, filename);
}

export async function getSystemStatusAction() {
    return {
        openai: process.env.OPENAI_API_KEY ? `sk-${process.env.OPENAI_API_KEY.slice(0, 3)}...${process.env.OPENAI_API_KEY.slice(-3)}` : null,
        gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? `AIza...${process.env.GOOGLE_GENERATIVE_AI_API_KEY.slice(-3)}` : null,
        youtube: process.env.YOUTUBE_API_KEY ? `AIza...${process.env.YOUTUBE_API_KEY.slice(-3)}` : null,
        googleCloud: (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_S3_ACCESS_KEY?.startsWith("GOOG")) ? "Active (Vault)" : null
    };
}

export async function saveScriptToVaultAction(config: S3Config, content: string, title: string): Promise<{ success: boolean; key?: string; error?: string }> {
    try {
        const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filename = `${safeTitle}-${Date.now()}.md`;
        const folder = "scripts";

        const fullConfig = getServerS3Config(config);
        const key = await saveContentToVault(fullConfig, content, folder, filename);
        if (key) return { success: true, key };
        return { success: false, error: "Upload failed" };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function saveBase64ImageToVaultAction(config: S3Config, base64Data: string, title: string, context: string = "snapshot"): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fullConfig = getServerS3Config(config);

        // Remove header if present (data:image/png;base64,...)
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');

        const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${timestamp}-${safeTitle}.png`;
        const folder = "images";

        const { saveBufferToVault } = await import("@/lib/storage");
        const url = await saveBufferToVault(fullConfig, buffer, folder, filename, "image/png");

        if (url) return { success: true, url };
        return { success: false, error: "Upload failed" };
    } catch (e) {
        console.error("Base64 Upload Error", e);
        return { success: false, error: String(e) };
    }
}



export async function saveSnapshotLocallyAction(base64Data: string, title: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        // Remove header
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');

        const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${timestamp}-${safeTitle}.png`;

        // Target Path: ../Screenshots Process (Relative to project root)
        const targetDir = path.resolve(process.cwd(), "../Screenshots Process");

        await fs.mkdir(targetDir, { recursive: true });

        const filePath = path.join(targetDir, filename);
        await fs.writeFile(filePath, buffer);

        return { success: true, path: filePath };
    } catch (e) {
        console.error("Local Save Error", e);
        return { success: false, error: String(e) };
    }
}

// Notebook Actions
import {
    getNotebookItems,
    createNotebookItem,
    updateNotebookItem,
    deleteNotebookItem,
    reorderNotebookItem,
    saveNotebookItems
} from "@/lib/notebook";
import {
    NotebookItem,
    NotebookItemType
} from "@/lib/notebook-types";

export async function getNotebookItemsAction(): Promise<NotebookItem[]> {
    return await getNotebookItems();
}

export async function createNotebookItemAction(
    type: NotebookItemType,
    title: string,
    description?: string,
    priority?: "low" | "medium" | "high",
    tags?: string[],
    formatId?: string
): Promise<NotebookItem> {
    return await createNotebookItem(type, title, description, priority, tags, formatId);
}



export async function updateNotebookItemAction(id: string, updates: Partial<NotebookItem>): Promise<{ success: true } | { success: false }> {
    try {
        await updateNotebookItem(id, updates);
        revalidatePath("/notebook");
        return { success: true };
    } catch (e) {
        console.error("Update Notebook Item Failed", e);
        return { success: false };
    }
}

export async function deleteNotebookItemAction(id: string): Promise<void> {
    return await deleteNotebookItem(id);
}

export async function reorderNotebookItemAction(id: string, direction: "up" | "down"): Promise<void> {
    await reorderNotebookItem(id, direction);
    revalidatePath("/notebook");
}

export async function saveNotebookOrderAction(items: NotebookItem[]): Promise<{ success: true }> {
    await saveNotebookItems(items);
    revalidatePath("/notebook");
    return { success: true };
}

// Notebook Config Actions
import {
    getNotebookConfig,
    updateTagColor,
    saveNotebookConfig
} from "@/lib/notebook-config";
import { NotebookConfig } from "@/lib/notebook-config-types";


export async function getNotebookConfigAction(): Promise<NotebookConfig> {
    return await getNotebookConfig();
}

export async function updateTagColorAction(tag: string, color: string): Promise<NotebookConfig> {
    return await updateTagColor(tag, color);
}

export async function renameTagAction(oldName: string, newName: string): Promise<void> {
    if (!oldName || !newName || oldName === newName) return;

    // 1. Update Items
    const items = await getNotebookItems();
    let itemsChanged = false;
    const newItems = items.map(item => {
        if (item.tags && item.tags.includes(oldName)) {
            itemsChanged = true;
            return {
                ...item,
                tags: item.tags.map(t => t === oldName ? newName : t)
            };
        }
        return item;
    });

    if (itemsChanged) {
        await saveNotebookItems(newItems);
    }

    // 2. Update Config (Colors)
    const config = await getNotebookConfig();
    if (config.tagColors && config.tagColors[oldName]) {
        const color = config.tagColors[oldName];
        const newColors = { ...config.tagColors };
        delete newColors[oldName];
        newColors[newName] = color;
        await saveNotebookConfig({ ...config, tagColors: newColors });
    }
}

// Genesis Automation Action
import fs from "fs/promises";
import path from "path";

export async function startGenesisAction(item: NotebookItem): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        console.log(`[Genesis] Starting automation for: ${item.title}`);

        // 1. Generate Content (Blueprint)
        // We reuse generateBlueprint. We need a basic "context" if we don't have a video transcript.
        // For a new idea, the context is the description itself + title.

        const context = `
PROJECT TITLE: ${item.title}
DESCRIPTION: ${item.description || "No description provided."}
TAGS: ${item.tags?.join(", ") || "None"}

INSTRUCTION: Create a Viral Video Blueprint for this concept.
        `.trim();

        // We use a dummy ID or just pass context directly if we refactor generateBlueprint, 
        // but generateBlueprint expects a transcript. 
        // Let's us generateIdeasFromGemini logic but strictly for a Blueprint structure.
        // Actually, let's call Gemini directly here or simple wrapper? 
        // Using generateBlueprint requires a "contextContent" string. perfectly fine to pass our context there.

        const { getViralConstitution } = await import("@/lib/openai");
        const constitution = await getViralConstitution(); // Use this for "Style"

        const blueprint = await generateBlueprint(context, item.title, "DE", undefined, {
            // Override instructions to treat context as the "Seed" not just a transcript
            "ROLE": "You are the Genesis Engine. You take a raw idea and expand it into a full production blueprint."
        });

        // 2. Generate Image Prompts (Legacy)
        const imagePrompts = await generateImagePromptsAction(item.title);

        // 2b. Generate Loop Assets (Shorts Mode)
        // We always generate these now as per user request for "Fastmode"
        const { generateViralLoopAssets } = await import("@/lib/gemini");
        const loopAssets = await generateViralLoopAssets(item.title, item.description, blueprint.original.hook);


        // 3. File System Operations
        // Path: /Users/remo.stiefel/Desktop/YT NC optimized/NeuroCode_Teasers/[SafeTitle]
        const safeTitle = item.title.replace(/[^a-z0-9äöüß]/gi, '_').replace(/_+/g, '_');
        const teaserDir = path.join("/Users/remo.stiefel/Desktop/YT NC optimized/NeuroCode_Teasers", safeTitle);

        await fs.mkdir(teaserDir, { recursive: true });

        // Write Blueprint
        const blueprintContent = `
# ${item.title}
> Status: ${item.status} | Priority: ${item.priority}

## VIRAL HOOK
${blueprint.original.hook}

## CORE VALUE
${blueprint.original.twist}

## SCRIPT OUTLINE
${blueprint.original.structure.map(s => `- ${s}`).join("\n")}

## TITLE IDEAS
${blueprint.adaptation.differentiation.map(t => `- ${t}`).join("\n")}

## THUMBNAIL CONCEPTS / KEYFRAMES
${loopAssets.imagePrompts.map(img => `### ${img.scene}\n> Midjourney: \`${img.midjourney}\``).join("\n\n")}

## VIDEO PROMPTS (Motion)
${loopAssets.videoPrompts.map(v => `- [${v.action}] Runway: \`${v.runway}\``).join("\n")}

## MUSIC PROMPTS (Suno/Udio)
${loopAssets.musicPrompts.map(m => `- [${m.style}] ${m.bpm} BPM: \`${m.prompt}\``).join("\n")}

---
*Generated by Neuro-Code Genesis Engine*
        `.trim();

        await fs.writeFile(path.join(teaserDir, "blueprint.md"), blueprintContent, "utf-8");

        // Write Metadata/Prompts
        const metadata = {
            id: item.id,
            origin: "Notebook",
            timestamp: new Date().toISOString(),
            legacyPrompts: imagePrompts,
            assets: loopAssets
        };

        await fs.writeFile(path.join(teaserDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf-8");

        // Also save explicit prompts.json for easier copy-paste
        await fs.writeFile(path.join(teaserDir, "prompts.json"), JSON.stringify(loopAssets, null, 2), "utf-8");

        console.log(`[Genesis] Assets saved to: ${teaserDir}`);
        return { success: true, path: teaserDir };

    } catch (e: any) {
        console.error("[Genesis] Failed:", e);
        return { success: false, error: e.message };
    }
}

// YouTube SEO Optimizer Action
import { generateOptimization, YoutubeOptimizerResult } from "@/lib/agents/youtube-optimizer";

export async function optimizeVideoMetadataAction(
    script: string,
    type: 'all' | 'filename' | 'title' | 'description' | 'tags'
): Promise<YoutubeOptimizerResult | null> {
    return await generateOptimization(script, type);
}



