
import * as dotenv from "dotenv";
import path from "path";
// Load ENV from .env.local BEFORE other imports
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("🔑 Checking OpenAI Key:", process.env.OPENAI_API_KEY ? "Found" : "Missing");

import fs from "fs/promises";


async function run() {
    // Dynamic Import to ensure ENV is loaded first
    const { generateScriptWithOpenAI, generateVideoPrompts, generateAudioPrompts, generateScriptImagePrompts } = await import("../src/lib/openai");
    const { saveTemplate } = await import("../src/lib/templates");

    const topic = "Short-12";
    console.log(`🚀 Starting Automation for: ${topic} (30s)`);

    // 1. Generate Script (30s)
    console.log("📝 Generating Script (30s)...");
    const script = await generateScriptWithOpenAI(
        topic,
        "Neuroscience / Productivity",
        "DE",
        undefined, // no strategy override
        false, // perfect loop default (optional)
        "30s", // DURATION
        false // meta narrative
    );

    if (!script) {
        console.error("❌ Script generation failed.");
        return;
    }
    console.log(`✅ Script Generated: ${script.title}`);

    // Save Script as Template (so user can load it)
    await saveTemplate({
        type: "script",
        name: `Draft: ${topic}`,
        content: script.sections.map(s => `## ${s.heading}\n\n${s.content}`).join("\n\n")
    });

    // 2. Generate Video Prompts
    console.log("🎬 Generating Video Prompts...");
    const scriptText = script.sections.map(s => s.content).join("\n");
    const videoPrompts = await generateVideoPrompts(scriptText, 6);

    console.log(`✅ ${videoPrompts.length} Video Prompts Generated`);
    await saveTemplate({
        type: "prompt",
        name: `🎬 Prompts: ${topic}`,
        content: videoPrompts
    });

    // 3. Generate Audio Prompts
    console.log("🎵 Generating Audio Prompts...");
    const audioPrompts = await generateAudioPrompts(scriptText);
    if (audioPrompts) {
        console.log("✅ Audio Strategy Generated");
        await saveTemplate({
            type: "audio",
            name: `🎵 Audio: ${topic}`,
            content: audioPrompts
        });
    }

    // 4. Generate Visual Prompts (Image Forge)
    console.log("🖼️ Generating Image Prompts...");
    const imagePrompts = await generateScriptImagePrompts(scriptText);
    console.log(`✅ ${imagePrompts.length} Image Prompts Generated`);
    await saveTemplate({
        type: "visual",
        name: `🖼️ Visuals: ${topic}`,
        content: imagePrompts
    });

    console.log("✨ Automation Complete! All assets saved to Library.");
}

run().catch(console.error);
