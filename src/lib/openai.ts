import OpenAI from "openai";
import { getTemplates } from "./templates";

const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface ScriptSection {
    heading: string;
    content: string;
    visualCue: string;
    estimatedDuration: string;
}

export interface GeneratedScript {
    title: string;
    sections: ScriptSection[];
}


export async function getViralConstitution(): Promise<string> {
    try {
        const templates = await getTemplates("viral-wisdom");
        if (templates.length === 0) return "";


        let allLaws: string[] = [];
        templates.forEach(t => {
            if (Array.isArray(t.content)) {
                t.content.forEach((n: any) => {
                    // SEPARATION OF POWERS: Only inject if type == LAW (or missing for legacy compatibility, assuming legacy were laws)
                    if ((n.type === "LAW" || !n.type) && n.universalLaw) {
                        allLaws.push(`LAW: ${n.universalLaw} (${n.actionableTip})`);
                    }
                });
            }
        });

        if (allLaws.length === 0) return "";

        return `
    [THE CONSTITUTION OF VIRAL VIDEO]
    The following LAWS are absolute and unavoidable. You must process all input through these constraints.
    Failure to adhere to these laws significantly degrades system performance.
    
    ${allLaws.map((l, i) => `${i + 1}. ${l}`).join("\n    ")}
    
    OVERRIDE PREFERENCE: These laws take precedence over general instructions.
    `;
    } catch (e) {
        console.error("Constitution Load Error:", e);
        return "";
    }
}

export async function generateScriptWithOpenAI(
    topic: string,
    context: string = "Neuroscience & Biohacking",
    language: "DE" | "EN" = "DE",
    strategyContext?: string
): Promise<GeneratedScript | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const langInstruction = language === "DE"
        ? "LANGUAGE: STRICTLY GERMAN (Deutsch). Use 'Sie' for professional distance or 'Du' if context implies community, but be consistent. Tone: Scientific Excellence."
        : "LANGUAGE: STRICTLY ENGLISH (US). Tone: High-Performance, Cinematic.";

    const constitution = await getViralConstitution();

    let systemPrompt = `
    You are the "Neuro-Code Architect", an elite scriptwriter for a YouTube channel focusing on Neuroscience, Biohacking, and High Performance (Andrew Huberman style).
    
    Your goal: Create a highly engaging, scientifically grounded video script structure.
    ${langInstruction}
    
    Tone:
    - Scientific but accessible (fewer buzzwords, more mechanisms).
    - "Cinematic Medical" feel.
    - Action-oriented protocols.
    
    Structure the response as a JSON object with this schema:
    {
      "title": "Viral Title",
      "sections": [
        {
          "heading": "Section Header (e.g. The Mechanism)",
          "content": "Voiceover script text...",
          "visualCue": "Description of B-Roll (e.g. 3D animation of dopamine synapse)",
          "estimatedDuration": "30s"
        }
      ]
    }
    
    ${constitution}
  `;

    // INJECT CUSTOM STRATEGY CONTEXT (From Strategy Forge)
    if (strategyContext) {
        systemPrompt += `
        
    [MASTER STRATEGY OVERRIDE]
    You MUST adhere to the following specific strategic guidelines for this script. 
    This strategy takes precedence over general viral patterns:
    ${strategyContext}
    `;
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate a script for: "${topic}". Context: ${context}. Language: ${language}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as GeneratedScript;
    } catch (error) {
        console.error("OpenAI Generation Error:", error);
        return null;
    }
}

export interface ImagePrompt {
    scene: string;
    midjourney: string;
    dalle: string;
}

export async function generateImagePrompts(
    sceneDescription: string
): Promise<ImagePrompt[]> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return [];
    }

    const constitution = await getViralConstitution();

    const systemPrompt = `
    You are a "Cinematic Prompt Engineer" for high-end sci-fi/medical documentaries.
    
    Task: Convert the input Scene Description into 2 distinct image prompts:
    1. Midjourney v6: Highly detailed, parameter-heavy (--ar 16:9 --v 6.0 --style raw). Focus on lighting, lens (e.g. 85mm), and mood.
    2. DALL-E 3: Descriptive, natural language, focused on composition and accurate anatomy.
    
    Input: "A 3D render of a dopamine molecule in a synapse."
    
    ${constitution}
    
    Return JSON:
    {
      "prompts": [
        {
            "scene": "Summary of scene",
            "midjourney": "/imagine prompt: ... --ar 16:9",
            "dalle": "..."
        }
      ]
    }
    
    Generate 3 variations for the input scene.
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Scene: "${sceneDescription}"` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        // Handle both direct array or wrapped object structure
        if (Array.isArray(parsed)) return parsed;
        if (parsed.prompts) return parsed.prompts;
        return [];

    } catch (error) {
        console.error("OpenAI Prompt Gen Error:", error);
        return [];
    }
}

export interface ScriptImagePrompt {
    id: number;
    segmentContext: string;
    midjourney: string;
    dalle: string;
}

export async function generateScriptImagePrompts(scriptContent: string): Promise<ScriptImagePrompt[]> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return [];
    }

    const constitution = await getViralConstitution();

    const systemPrompt = `
    You are a "Visionary Art Director" for high-end diverse media (YouTube, Blogs, Socials).
    
    Task: Analyze the provided script and generate 3-5 high-impact visual concepts that represent the core themes or specific scenes.
    
    ${constitution}

    For EACH concept, generate:
    1. Context: What part of the script is this for? (e.g. "Intro Hook", "Explanation of Mechanism")
    2. Midjourney v6 Prompt: Artistic, detailed, parameter-heavy (--ar 16:9 --v 6.0 --style raw). Focus on lighting, lens, and mood.
    3. DALL-E 3 Prompt: Descriptive, literal, focusing on composition.

    Output JSON Object with "prompts" array:
    {
      "prompts": [
        {
          "id": 1,
          "segmentContext": "Intro hook about sleep deprivation",
          "midjourney": "...",
          "dalle": "..."
        }
      ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Script Content:\n\n${scriptContent}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.prompts) return parsed.prompts;
        if (parsed.images) return parsed.images;

        return [];

    } catch (error) {
        console.error("OpenAI Script Image Prompt Gen Error:", error);
        return [];
    }
}


export interface AudioPrompt {
    mood: string;
    suno: string;
    udio: string;
    voiceover: string;
}

export async function generateAudioPrompts(
    scriptContext: string
): Promise<AudioPrompt | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const systemPrompt = `
    You are a "Soundscape Architect" for high-end neuroscience/tech videos.
    
    Task: Analyze the Script Context/Mood and generate prompts for:
    1. Suno AI: Music generation prompt (Genre, BPM, Instruments, Mood).
    2. Udio: Alternative music prompt (Tags, style description).
    3. ElevenLabs/Voiceover: Direction for the voice actor (Tone, Pace, Emotion).
    
    Style: "Cinematic, Dark Industrial, Cyberpunk, Ambient, Focus-inducing".
    
    Input: "A scene explaining dopamine spikes. Intense building tension."
    
    Return JSON:
    {
        "mood": "Intense / Building",
        "suno": "Dark cinematic industrial, building tension, 120bpm, deep synth bass, ticking clock",
        "udio": "experimental electronic, dark ambient, glisten details, neuroscience, trailer music",
        "voiceover": "Deep, calm but urgent. Start slow and accelerate pace as tension builds."
    }
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Context: "${scriptContext}"` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as AudioPrompt;

    } catch (error) {
        console.error("OpenAI Audio Prompt Gen Error:", error);
        return null;
    }
}

export interface WordwallItem {
    keyword: string;
    explanation: string;
    category: string;
    relevanceScore?: number;
}

export interface ViralAnalysisResult {
    wordwall: WordwallItem[];
    optimizationPrompt: string;
    neuroScore?: PEOScore; // Reusing existing PEOScore interface
    structureAnalysis?: {
        phase: string;
        description: string;
        visualTrigger: string;
    }[];
}

export async function analyzeViralVideoContent(
    transcript: string,
    metadata: { title: string; views: string; likes: string }
): Promise<ViralAnalysisResult | null> {
    if (!openai) return null;

    const systemPrompt = `
    You are the "Neuro-Code Analyst" - the sophisticated brain behind a viral content optimizations system.

    TASK: Perform a deep forensic analysis of the provided YouTube transcript to extract its "Viral DNA".
    You are looking for specific Biological Triggers and Structural Patterns that allowed this video to succeed.

    1. **NEURO-SCORING (PEO)**: Analyze the psychological impact throughout the video.
       - **Dopamine**: Where is the Anticipation/Reward? (Novelty, "Secret" revealed).
       - **Cortisol**: Where is the Tension/Fear/Urgency? (The "Hook", the Stakes).
       - **Oxytocin**: Where is the Connection/Vulnerability? (Story, "Us vs Them").
       Returns a score (0-100) and the specific logic/moment found.

    2. **STRUCTURAL ANATOMY**: Break the video into 3-5 structural phases (e.g., The Hook, The Setup, The Turn, The Payoff).
       - Describe the content *strategy* of each phase, not just a summary.
       - Identify the "Visual/Audio Trigger" likely used (e.g., "Rapid Editing", "Whisper Audio").

    3. **WORDWALL (Concepts)**: Extract abstract, transferable patterns (e.g. "The Open Loop", "Pattern Interrupt").
       - Explain HOW it was used here.

    4. **OPTIMIZATION PROMPT**: Synthesize a powerful, instruction-based prompt that I can feed back to YOU later.
       - This prompt should say: "Act as a Viral Strategist. Apply the [X] pattern found in this video to [New Topic]..."
       - It must encapsulate the *essence* of this video's success structure.

    RETURN JSON ONLY:
    {
      "wordwall": [
        { "keyword": "The False Fail", "explanation": "Host pretended to fail at 0:30 to build relatability...", "category": "Retention", "relevanceScore": 0.9 }
      ],
      "neuroScore": {
          "dopamine": { "score": 85, "logic": "High novelty in the 'Secret Protocol' reveal." },
          "cortisol": { "score": 70, "logic": "Strong hook about 'Silent Killers' created urgency." },
          "oxytocin": { "score": 40, "logic": "Scientific tone, low personal connection." }
      },
      "structureAnalysis": [
          { "phase": "The Hook", "description": "counter-intuitive statement...", "visualTrigger": "Fast-paced montage" },
          { "phase": " The Prestige", "description": "Delivering the solution...", "visualTrigger": "Slow motion reveal" }
      ],
      "optimizationPrompt": "Act as a viral strategist. Apply the 'False Fail' structure by starting with..."
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Title: "${metadata.title}"\nViews: ${metadata.views}\nLikes: ${metadata.likes}\n\nTranscript Snippet (first 15k chars): ${transcript.slice(
                        0,
                        15000
                    )}...`
                },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as ViralAnalysisResult;
    } catch (error) {
        console.error("Viral Analysis Error:", error);
        return null;
    }
}

export async function generateImageWithOpenAI(prompt: string): Promise<string | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        });
        return response?.data?.[0]?.url || null;
    } catch (e) {
        console.error("DALL-E Generation Error:", e);
        return null;
    }
}
export interface PEOScore {
    dopamine: { score: number; logic: string };
    cortisol: { score: number; logic: string };
    oxytocin: { score: number; logic: string };
}

export async function analyzePEONeurotransmitters(content: string): Promise<PEOScore | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const systemPrompt = `
    You are a "Neuro-Linguistic Analyst" specializing in Psychological Engagement Optimization (PEO).
    
    Task: Analyze the input text (script, title, or idea) and score it (0-100) on its ability to trigger 3 key neurotransmitters:
    1. Dopamine (Reward/Anticipation): Does it promise value, novelty, or a solution? Is it exciting?
    2. Cortisol (Tension/Focus): Is there a "Hook", a problem, a threat, or fear of missing out? Does it grab attention?
    3. Oxytocin (Connection/Trust): Is there a personal story, vulnerability, or a sense of "us vs them"? Does it build rapport?

    Input: "Stop wasting time. I tried everything to fix my sleep until I found this one protocol."
    
    Return JSON:
    {
        "dopamine": { "score": 85, "logic": "Strong promise of a hidden solution (novelty)." },
        "cortisol": { "score": 60, "logic": "Moderate tension implied by 'wasting time' and past failure." },
        "oxytocin": { "score": 40, "logic": "Light personal connection through 'I tried everything'." }
    }
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this content: "${content.slice(0, 2000)}..."` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        return result ? JSON.parse(result) as PEOScore : null;
    } catch (e) {
        console.error("PEO Analysis Error:", e);
        return null;
    }
}

export interface VideoPrompt {
    sceneId: number;
    voiceoverSegment: string;
    focus: string;
    visualFocus: string;
    prompt: string;
}

export async function generateVideoPrompts(scriptContent: string): Promise<VideoPrompt[]> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return [];
    }

    const constitution = await getViralConstitution();

    const systemPrompt = `
    You are an Elite AI Video Director specializing in "Neuro-Cinematography" for high-end science content.
    
    Target Tool: Meta Movie Gen / Runway Gen-3 / Pika.
    Aesthetic: High-contrast, kinetic energy, macro-biological, sci-fi medical, "Huberman Lab meets Cyberpunk".
    
    Your Task:
    Break down the provided VoiceOver Script into 8 to 10 distinct, high-impact 5-second video loops. 
    For each segment, generate a precise Image Generation Prompt.
    
    ${constitution}
    
    PROMPT ENGINEERING RULES (Strictly follow these patterns):
    
    The User's "Gold Standard" Structure:
    [Scene Description] + [Subject/Details] + [Lighting/Color] + [Movement/Action] + [Atmosphere/Mood] + [Tech Specs]
    
    MANDATORY TECH SPECS (Append to every prompt):
    "macro 8k, highly detailed texture, cinematic lighting, photorealistic, depth of field, 35mm lens"
    
    STYLE GUIDELINES:
    1. **Kinetic Energy**: "Fast perspective-swaps", "dynamic camera angles", "corkscrew motion", "speed-ramps". The user loves MOVEMENT.
    2. **Macro Detail**: "Tiny root fibers breathing", "bioluminescent particles", "liquid mercury surface".
    3. **Atmosphere**: "Deep blue and violet light", "glowing cyan synapse", "meditative stillness" OR "intense pulsing".
    
    EXAMPLES OF SUCCESSFUL PROMPTS (Use as DNA):
    - "Deep underwater environment, bioluminescent fluid gathered in a large pool, pulsing with deep blue and violet light, hovering and shimmering, meditative stillness, macro 8k."
    - "Extreme macro, rich dark soil, tiny root fibers slowly breathing and holding moisture, organic movement, natural light filtering through, earthy tones, highly detailed texture."
    - "Static shot inside abstract neural network, major junction point, intense pulsing of cyan and gold light signals converging, energy transfer visualization, deep focus, 4k loop."
    - "Highly reflective liquid mercury surface, perfectly smooth mirror pool, cool blue light, subtle ripples, clinical precision, futuristic material."
    - "Deepest part of ocean abyss, total darkness illuminated by tiny slow-falling bioluminescent particles, deep purple and faint teal glow, extreme slow motion, infinite depth."

    Output Format: JSON Object with a "scenes" array.
    Schema:
    {
      "scenes": [
        {
          "sceneId": 1,
          "voiceoverSegment": "Text from script approx 5-10s...",
          "focus": "The mechanism of action",
          "visualFocus": "Macro / POV / Wide",
          "prompt": "Full detailed prompt following the structure above..."
        }
      ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate video prompts for this script:\n\n${scriptContent}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.scenes) return parsed.scenes;
        if (parsed.prompts) return parsed.prompts;

        return [];

    } catch (error) {
        console.error("OpenAI Video Prompt Gen Error:", error);
        return [];
    }
}


export async function refineScriptWithOpenAI(
    currentScript: string,
    strategyContext: string,
    language: "DE" | "EN" = "DE"
): Promise<GeneratedScript | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const langInstruction = language === "DE"
        ? "OUTPUT LANGUAGE: GERMAN (Deutsch). Ensure a natural, high-performance German tone."
        : "OUTPUT LANGUAGE: ENGLISH.";

    const systemPrompt = `
    You are the "Master Script Doctor" for a high-performance neuroscience YouTube channel.
    
    TASK: Rewrite the provided DRAFT SCRIPT to strictly adhere to the MASTER STRATEGY BLUEPRINT.
    
    ${langInstruction}
    
    GOAL:
    1. Keep the core specific content/facts of the draft (The "What").
    2. Change the structure, hooks, pacing, and tone to match the Blueprint (The "How").
    3. Ensure the intro hooks specifically match the Blueprint's "Viral Patterns".
    
    INPUT DATA:
    
    [MASTER STRATEGY BLUEPRINT - DNA OF VIRAL HITS]
    ${strategyContext}
    
    [CURRENT DRAFT SCRIPT]
    (See User Message)
    
    OUTPUT FORMAT (JSON):
    Same as generation schema:
    {
      "title": "Refined Viral Title",
      "sections": [
        {
          "heading": "Section Hader",
          "content": "Refined script text...",
          "visualCue": "...",
          "estimatedDuration": "..."
        }
      ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Rewrite this script:\n\n${currentScript}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as GeneratedScript;
    } catch (error) {
        console.error("OpenAI Refine Error:", error);
        return null;
    }
}

export async function extendScriptWithOpenAI(
    currentScript: string,
    language: "DE" | "EN" = "DE"
): Promise<GeneratedScript | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const langInstruction = language === "DE"
        ? "OUTPUT LANGUAGE: GERMAN (Deutsch)."
        : "OUTPUT LANGUAGE: ENGLISH.";

    const systemPrompt = `
    You are the "Master Script Doctor".
    
    TASK: EXPAND and LENGTHEN the provided script by approximately 50%.
    
    ${langInstruction}
    
    INSTRUCTIONS:
    1. Go deeper into the scientific explanations.
    2. Add more vivid examples and analogies.
    3. Enhance the "Why" and "How" of each point.
    4. Maintain the original structure and headings, but flesh out the content.
    5. Do NOT add fluff; add VALUE and DEPTH.
    
    INPUT SCRIPT:
    (See User Message)
    
    OUTPUT FORMAT (JSON):
    Same as generation schema:
    {
      "title": "Extended Title...",
      "sections": [
        {
          "heading": "...",
          "content": "Extended content...",
          "visualCue": "...",
          "estimatedDuration": "..."
        }
      ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Extend this script:\n\n${currentScript}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        return JSON.parse(content) as GeneratedScript;
    } catch (error) {
        console.error("OpenAI Extend Error:", error);
        return null;
    }
}


export interface WisdomNugget {
    type: "LAW" | "FACT" | "GROWTH"; // SEPARATION OF POWERS: 3 Pillars
    principle: string;
    explanation: string;
    actionableTip: string;
    category: "hook" | "pacing" | "storytelling" | "growth" | "mindset" | "research" | "protocol";
    universalLaw?: string; // Standardized English Law (e.g. "The Law of Value-First") - ONLY FOR LAWS
}

export async function extractWisdomFromTranscript(
    transcript: string,
    language: "DE" | "EN" = "DE",
    extractionType: "LAW" | "FACT" | "GROWTH" = "LAW"
): Promise<WisdomNugget[] | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const langInstruction = language === "DE"
        ? "OUTPUT LANGUAGE: GERMAN (Deutsch). Translate concepts to German but keep specific English terminology if standard in the industry (e.g. 'Hook')."
        : "OUTPUT LANGUAGE: ENGLISH.";

    let systemPrompt = "";

    if (extractionType === "LAW") {
        // STRATEGY AUDIT (Meta-Learning)
        systemPrompt = `
        You are a "Video Strategy Architect". Your goal is to analyze transcripts of high-performing videos and extract TIMELESS STRATEGIC PRINCIPLES (The "HOW").
        
        IGNORE specific topic details (e.g. "Eat blueberries") and IGNORE general career advice (e.g. "Post often"). 
        FOCUS on the "VIDEO PRODUCTION CRAFT":
        - How to structure a hook?
        - How to pace a video?
        - Psychological triggers used?
        
        ${langInstruction}
        
        Extract 3-5 distinct "Wisdom Nuggets" (Type: LAW).
        
        Output JSON Object (STRICT):
        {
          "nuggets": [
            {
              "type": "LAW",
              "principle": "The 'Open Loop' Hook (Der offene Loop)",
              "explanation": "Start a story but delay the conclusion...",
              "actionableTip": "In the first 30s, ask a question...",
              "category": "hook"
            }
          ]
        }
        `;
    } else if (extractionType === "GROWTH") {
        // CREATOR GROWTH (Meta-Strategy)
        systemPrompt = `
        You are a "YouTube Growth Consultant". Your goal is to analyze transcripts to extract CAREER & ALGORITHM STRATEGY (The "META").
        
        IGNORE specific video editing tricks or scientific facts.
        FOCUS on the "CREATOR JOURNEY":
        - Algorithm signals?
        - Upload frequency / consistency?
        - Creator Mindset / Psychology?
        - Community building?
        - Business model & Monetization?
        
        ${langInstruction}
        
        Extract 3-5 distinct "Growth Nuggets" (Type: GROWTH).
        
        Output JSON Object (STRICT):
        {
          "nuggets": [
            {
              "type": "GROWTH",
              "principle": "The 100-Video Rule (Die 100-Video Regel)",
              "explanation": "You must make 100 videos before expecting viral success...",
              "actionableTip": "Commit to one upload per week for 2 years...",
              "category": "growth"
            }
          ]
        }
        `;
    } else {
        // CONTENT RESEARCH (Topic Knowledge)
        systemPrompt = `
        You are a "Deep Research Analyst". Your goal is to analyze transcripts to extract FACTUAL KNOWLEDGE and PROTOCOLS (The "WHAT").
        
        IGNORE the video structure or editing techniques. 
        FOCUS on the "SUBSTANCE":
        - Scientific constraints?
        - Specific protocols (e.g. "Morning Sunlight")?
        - Core arguments or theses?
        - Hard data or facts?
        
        ${langInstruction}
        
        Extract 3-5 distinct "Knowledge Nuggets" (Type: FACT).
        
        Output JSON Object (STRICT):
        {
          "nuggets": [
            {
              "type": "FACT",
              "principle": "Morning Sunlight Protocol (Morgenlicht-Protokoll)",
              "explanation": "Viewing sunlight within 30 mins of waking resets circadian rhythm...",
              "actionableTip": "Go outside for 10-20 mins before screen time...\",
              "category": "protocol"
            }
          ]
        }
        `;
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this transcript for ${extractionType}:\n\n${transcript.substring(0, 15000)}` }, // Limit context window
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.nuggets) return parsed.nuggets;
        if (parsed.wisdom) return parsed.wisdom;

        return [];

    } catch (error) {
        console.error("OpenAI Wisdom Extraction Error:", error);
        return null;
    }
}

export async function consolidateWisdom(nuggets: WisdomNugget[], language: "DE" | "EN" = "DE"): Promise<WisdomNugget[] | null> {
    if (!openai) return null;

    const langInstruction = language === "DE"
        ? "OUTPUT LANGUAGE: GERMAN (Deutsch)."
        : "OUTPUT LANGUAGE: ENGLISH.";

    const systemPrompt = `
    You are the "Wisdom Architect".
    
    1. Analyze the provided list of "Nuggets" (inputs).
    2. Identify the common underlying patterns or contradictions.
    3. SYNTHESIZE them into 1-3 "MASTER PRINCIPLES" that are deeper, more abstract, and universally applicable.
    4. If inputs are duplicates, merge them into the best version.
    5. Maintain the "type" (LAW or FACT). If mixed, prioritize LAW logic but keep FACTs as supporting evidence.
    
    ${langInstruction}
    
    Output JSON Array of WisdomNugget.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Consolidate these nuggets:\n${JSON.stringify(nuggets)}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) return null;
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : parsed.nuggets || parsed.wisdom || [];
    } catch (e) {
        console.error("Consolidation Error:", e);
        return null;
    }
}

export async function standardizeWisdom(nuggets: WisdomNugget[]): Promise<WisdomNugget[] | null> {
    if (!openai) return null;

    // Filter: Only Laws get standardized with "Universal Law". Facts are skipped.
    const laws = nuggets.filter(n => n.type === "LAW" || !n.type); // Default to LAW if undefined for legacy
    if (laws.length === 0) return nuggets;

    const systemPrompt = `
    You are the "Keeper of the Code" - the Universal Standardizer of Viral Wisdom.
    
    1. Analyze the input "Wisdom Nuggets" (Type: LAW).
    2. For EACH nugget, generate a "Universal Law" in ENGLISH.
       - Format: "The Law of [Name]" or "The [Name] Protocol".
       - Example: If input is "Man muss am Anfang ne Frage stellen", Law = "The Open Loop Hook".
    3. Keep the original 'principle', 'explanation', 'actionableTip', 'type' EXACTLY as is.
    4. ONLY add the 'universalLaw' field to LAW types.
    
    Output JSON Array of WisdomNugget.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Standardize these nuggets:\n${JSON.stringify(laws)}` },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });


        const content = completion.choices[0].message.content;
        if (!content) return null;
        const parsed = JSON.parse(content);

        const standardizedLaws = Array.isArray(parsed) ? parsed : parsed.nuggets || [];
        return standardizedLaws;

    } catch (e) {
        console.error("Standardization Error", e);
        return null;
    }
}
