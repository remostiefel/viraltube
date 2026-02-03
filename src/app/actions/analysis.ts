"use server";

import { extractWisdomFromTranscript, WisdomNugget, standardizeWisdom, analyzePEONeurotransmitters, PEOScore } from "@/lib/openai";
import { getVideoTranscript, getVideoMetadata } from "@/lib/youtube";
import { searchOpenAlex, ScientificPaper } from "@/lib/openalex";

import { optimizeTitleWithGemini, OptimizationResult, sendChatMessage, ChatMessage, analyzeHookRetention, RetentionAnalysis } from "@/lib/gemini";
import { getTemplates } from "@/lib/templates";


// --- Wisdom Extraction ---
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
                videoId = urlObj.searchParams.get("v") || urlObj.pathname.replace(/^\//, '') || "";
            }
        }

        videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
        if (!videoId) throw new Error("Invalid YouTube URL - could not extract Video ID");

        let transcript = await getVideoTranscript(videoId);

        // Fallback: Try Metadata
        if (!transcript) {
            console.warn(`Transcript unavailable for ${videoId}, falling back to metadata.`);
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                const metadata = await getVideoMetadata(videoId, apiKey);
                if (metadata) {
                    transcript = `[NOTE: TRANSCRIPT UNAVAILABLE - ANALYZING METADATA DO NOT HALLUCINATE]\n\nVIDEO TITLE: ${metadata.title}\n\nVIDEO DESCRIPTION:\n${metadata.description}`;
                }
            }
        }

        // Final Fallback: oEmbed
        if (!transcript) {
            console.warn(`Metadata unavailable for ${videoId}, falling back to oEmbed.`);
            const { getVideoBasicInfoFallback } = await import("@/lib/youtube");
            const basicInfo = await getVideoBasicInfoFallback(videoId);
            if (basicInfo) {
                transcript = `[NOTE: TRANSCRIPT AND METADATA UNAVAILABLE - ANALYZING BASIC INFO]\n\nVIDEO TITLE: ${basicInfo.title}\n\nAUTHOR: ${basicInfo.author}`;
            }
        }

        if (!transcript) throw new Error("Could not fetch video info. Check URL or Privacy Settings.");

        const result = await extractWisdomFromTranscript(transcript, language, extractionType);
        if (!result) throw new Error("AI Analysis returned empty result");

        return result;

    } catch (e: any) {
        console.error("Error extracting wisdom from URL:", e);
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
        const syntheticInput = `PRINCIPLE: ${input.principle}\n\nEXPLANATION: ${input.explanation}`;
        const nuggets = await extractWisdomFromTranscript(syntheticInput, language, "LAW");

        if (!nuggets || nuggets.length === 0) return null;

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

// --- Deep Analysis & Chat ---
export async function analyzeHookRetentionAction(videoId: string): Promise<RetentionAnalysis | null> {
    let transcript = await getVideoTranscript(videoId);

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

export async function analyzePEOAction(content: string): Promise<PEOScore | null> {
    return await analyzePEONeurotransmitters(content);
}

export async function optimizeTitleAction(title: string): Promise<OptimizationResult> {
    return await optimizeTitleWithGemini(title);
}

export async function fetchScientificPapers(topic: string, source: "openalex" | "semantic" | "pubmed" = "semantic"): Promise<ScientificPaper[]> {
    if (source === "semantic") {
        const { searchSemanticScholar } = await import("@/lib/semanticscholar");
        return await searchSemanticScholar(topic);
    } else if (source === "pubmed") {
        const { searchPubMed } = await import("@/lib/pubmed");
        return await searchPubMed(topic);
    }
    return await searchOpenAlex(topic);
}

export async function processChat(history: ChatMessage[], message: string): Promise<string> {
    if (history.length === 0) {
        // 1. Fetch Viral Wisdom Context
        const wisdomTemplates = await getTemplates("viral-wisdom");
        let wisdomContext = "";

        if (wisdomTemplates.length > 0) {
            const wisdomTexts = wisdomTemplates.map(t => {
                const content = typeof t.content === 'string' ? t.content : t.content.optimizationPrompt;
                return `- From analysis "${t.name}": ${(content || "").substring(0, 200)}...`;
            }).join("\n");
            wisdomContext = `\n\nACCESS TO VIRAL KNOWLEDGE LIBRARY:\n${wisdomTexts}`;
        }

        // 2. Fetch Live Dashboard Context (The "Real-Eyes" Protocol)
        let liveContext = "";
        try {
            const { getProjectsAction } = await import("./project");

            const projects = await getProjectsAction();
            const activeProjects = projects.filter(p => p.status !== "done").map(p => `- ${p.title} (${p.status})`).join("\n");

            liveContext += `\n\nCURRENT PROJECTS:\n${activeProjects || "No active projects."}`;

            const { getChannelData } = await import("@/lib/youtube");
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                const channelData = await getChannelData(apiKey);
                if (channelData) {
                    liveContext += `\n\nLIVE CHANNEL STATS:\n- Subs: ${channelData.statistics.subscriberCount}\n- Total Views: ${channelData.statistics.viewCount}\n- Video Count: ${channelData.statistics.videoCount}`;
                }
            }

        } catch (e) {
            console.error("Failed to inject live context", e);
        }

        const { generateSystemPrompt } = await import("@/lib/coach-profile");
        const systemPrompt = generateSystemPrompt(`${liveContext}\n${wisdomContext}`);

        message = `${systemPrompt}\n\nUser: ${message}`;
    }
    return await sendChatMessage(history, message);
}

export async function generateCoachBriefingAction(): Promise<string> {
    try {
        // Collect Data for Briefing
        let context = "";

        // 1. Projects
        const { getProjectsAction } = await import("./project");
        const projects = await getProjectsAction();
        const active = projects.filter(p => p.status !== "done");
        context += `\nProjects: ${active.length} Active. ${active.map(p => p.title).join(", ")}`;

        // 2. Channel Stats (Public)
        const { getChannelData } = await import("@/lib/youtube");
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            const cData = await getChannelData(apiKey);
            if (cData) {
                context += `\nChannel: ${cData.statistics.subscriberCount} Subs, ${cData.statistics.viewCount} Views.`;
            }
        }

        // 3. Generate Briefing
        const { COACH_PROFILE } = await import("@/lib/coach-profile");

        const prompt = `You are the ${COACH_PROFILE.system.name} for ${COACH_PROFILE.user.name}.
Your Persona: ${COACH_PROFILE.system.basePersona}
User Priorities: ${COACH_PROFILE.user.priorities.join(", ")}

STATUS REPORT:
${context}

TASK: Generate a "Morning Briefing" (max 2 sentences) for ${COACH_PROFILE.user.name}.
- If stats are up: Celebrate progress (Driver).
- If stats are flat: Focus on the "Learning Process" (Stagnation Fear).
- Be concise. No quotes.`;

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(prompt);
        return result.response.text();

    } catch (e) {
        console.error("Briefing Generation Failed", e);
        return "Systems online. Ready to optimize.";
    }
}

import { predictViralPerformance, OraclePrediction } from "@/lib/oracle";

export async function predictPerformanceAction(
    title: string,
    script: string,
    strategy: string
): Promise<OraclePrediction> {
    const result = await predictViralPerformance(title, script, strategy);
    if (!result) {
        throw new Error("Failed to generate prediction");
    }
    return result;
}
