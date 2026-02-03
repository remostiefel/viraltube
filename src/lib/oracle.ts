import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface OraclePrediction {
    ctrprediction: {
        score: number; // 0-100 (Estimated CTR e.g. 12.5)
        confidence: "High" | "Medium" | "Low";
        reasoning: string;
    };
    avdprediction: {
        score: number; // 0-100 (Retention probability)
        dropOffRisk: string; // Timecode or "Intro"
        reasoning: string;
    };
    viralScore: number; // 0-100
    simulatedComments: {
        user: string;
        comment: string;
        sentiment: "positive" | "negative" | "neutral";
    }[];
}

export async function simulatePerformance(
    title: string,
    scriptContent: string,
    thumbnailIdea: string = "Not specified"
): Promise<OraclePrediction | null> {
    // ...
    return predictViralPerformance(title, scriptContent, thumbnailIdea);
}

export async function predictViralPerformance(
    title: string,
    scriptContent: string,
    thumbnailIdea: string = "Not specified"
): Promise<OraclePrediction | null> {
    if (!openai) {
        console.error("OpenAI API Key missing");
        return null;
    }

    const systemPrompt = `
    You are "The Oracle", an advanced AI simulating the YouTube Algorithm and Human Psychology.
    
    Task: Predict the performance of a video based on its Title, Thumbnail Idea, and Script.
    
    Simulate a "Virtual Focus Group" of 1000 viewers in the defined niche.
    
    1. **CTR Prediction**: Analyze the synergy between Title and Thumbnail. Is it clickbait? Is it intriguing? Does it promise value?
       - Score logic: <2% Bad, 2-5% Average, >8% Viral. (Return a number like 8.5)
    
    2. **AVD Prediction**: Analyze the script structure. Is the hook strong? Is the pacing fast enough? Where will people drop off?
       - Score logic: 0-100 (percentage of retention).
    
    3. **Viral Score**: How likely is this to get recommended to a broad audience (Broad appeal vs Niche)?
       - Score logic: 0-100.
    
    4. **Simulated Comments**: Generate 3 realistic comments from top-voted viewers.
       - Include one critical/skeptical comment if applicable.
       - Include one hyped comment.
       - Include one insightful comment.
    
    Return JSON:
    {
        "ctrprediction": { "score": 12.5, "confidence": "High", "reasoning": "Strong curiosity gap..." },
        "avdprediction": { "score": 65, "dropOffRisk": "0:45", "reasoning": "The explanation of the mechanism drags on too long." },
        "viralScore": 85,
        "simulatedComments": [
            { "user": "BioHacker99", "comment": "Finally someone explains this!", "sentiment": "positive" },
            { "user": "Skeptic", "comment": "Clickbait title but good content.", "sentiment": "neutral" },
            { "user": "NeuroNerd", "comment": "The mechanism at 2:00 is technically incorrect regarding...", "sentiment": "negative" }
        ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Title: "${title}"\nThumbnail Idea: "${thumbnailIdea}"\n\nScript Snippet (First 10k chars):\n${scriptContent.slice(0, 10000)}...`
                },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        return content ? JSON.parse(content) as OraclePrediction : null;

    } catch (error) {
        console.error("Oracle Prediction Error:", error);
        return null;
    }
}
