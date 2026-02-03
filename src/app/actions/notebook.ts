"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
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
import {
    getNotebookConfig,
    updateTagColor,
    saveNotebookConfig,
    NotebookConfig
} from "@/lib/notebook-config";
import { generateBlueprint, generateViralLoopAssets, generateAdaptationFromMaster } from "@/lib/gemini";
import { getViralConstitution, generateImagePrompts } from "@/lib/openai";

export async function getNotebookItemsAction(): Promise<NotebookItem[]> {
    return await getNotebookItems();
}

export async function createNotebookItemAction(
    type: NotebookItemType,
    title: string,
    description?: string,
    priority?: "low" | "medium" | "high",
    tags?: string[],
    formatId?: string,
    sourceUrl?: string
): Promise<NotebookItem> {
    const newItem = await createNotebookItem(type, title, description, priority, tags, formatId);
    if (sourceUrl) {
        // We need to update the item with the sourceUrl because createNotebookItem sig might not support it yet 
        // or we update the sig of createNotebookItem in lib/notebook first.
        // Actually, since I can't see lib/notebook implementation easily without viewing, 
        // I will update the item immediately after creation if the underlying lib doesn't support it.
        // But better: Assume I will fix `lib/notebook.ts` separately or now.
        // Wait, I am editing the action wrapper. Let's see if I can pass it.
        // To be safe and avoid touching too many files blindly, I'll do a forceful update.
        // Actually, let's just update the JSON structure directly via update. Use the update logic.
        await updateNotebookItem(newItem.id, { sourceUrl });
        newItem.sourceUrl = sourceUrl;
    }
    return newItem;
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
    await deleteNotebookItem(id);
    revalidatePath("/notebook");
}

export async function regenerateAdaptationAction(id: string, duration: "30s" | "60s" | "Long") {
    const filePath = path.join(process.cwd(), "src/data/notebook.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(fileContent) as NotebookItem[];

    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) throw new Error("Item not found");
    const item = items[itemIndex];

    // 1. Parse existing blueprint to get MASTER sections
    // This is a simple regex approach to find the original JSON structure if we stored it, 
    // BUT we are storing markdown. We need to reconstruct the "MasterBlueprint" object from the Markdown.
    // Ideally, we should store the JSON in the item as a separate field, but for now we parse.

    // Actually, in `startGenesis`, we have `blueprint` object. We should probably accept that we re-parse from Markdown.
    // Or simpler: we update the Markdown by replacing specific sections.
    // Parsing Markdown back to Object is fragile.
    // Let's rely on the parsing logic similar to the frontend.

    const blueprintText = item.blueprint || "";
    const masterHook = blueprintText.match(/## MASTER HOOK \(ENGLISH\)\n([\s\S]*?)\n##/)?.[1]?.trim() || "";
    const masterTwist = blueprintText.match(/## MASTER TWIST \(ENGLISH\)\n([\s\S]*?)\n##/)?.[1]?.trim() || "";
    // Structure is a list, we need to parse it back to array
    const masterStructureBlock = blueprintText.match(/## MASTER STRUCTURE \(ENGLISH\)\n([\s\S]*?)\n##/)?.[1]?.trim() || "";
    const masterStructure = masterStructureBlock.split("\n").map(l => l.replace(/^- /, "")).filter(Boolean);

    const masterBlueprint = {
        hook: masterHook,
        twist: masterTwist,
        structure: masterStructure,
        geniusElements: [] // Not critical for adaptation generation
    };

    if (!masterHook) throw new Error("Could not find Master Blueprint in existing file.");

    // 2. Generate New Adaptation
    const { adaptation, loopAssets } = await generateAdaptationFromMaster(masterBlueprint, duration, "DE");

    // 3. Reconstruct Markdown using the OLD Master sections + NEW Adaptation sections
    const masterAnalysis = blueprintText.match(/## MASTER STRATEGY \(ENGLISH\)\n([\s\S]*?)\n##/)?.[1]?.trim() || "";
    const masterGenius = blueprintText.match(/## MASTER GENIUS \(ENGLISH\)\n([\s\S]*?)\n##/)?.[1]?.trim() || "";

    // (omitting template internals for brevity in replacement chunk, just focusing on fixing keys if needed, 
    // actually, I'll just fix the lines with map issues below)

    const newBlueprintContent = `
# ${item.title}
> Status: ${item.status} | Priority: ${item.priority} | Duration: ${duration}

## MASTER HOOK (ENGLISH)
${masterHook}

## MASTER TWIST (ENGLISH)
${masterTwist}

## MASTER STRATEGY (ENGLISH)
${masterAnalysis}

## MASTER STRUCTURE (ENGLISH)
${masterStructureBlock}

## MASTER GENIUS (ENGLISH)
${masterGenius}

## VIRAL HOOK (DEUTSCH)
${adaptation.hook}

## CORE VALUE (DEUTSCH)
${adaptation.germanTwist}

## VOICEOVER SCRIPT (Google AI Studio)
${adaptation.voiceOverScript || "No script generated."}

## SCRIPT OUTLINE (DEUTSCH)
${adaptation.structure.map((s: string) => `- ${s}`).join("\n")}

## TITLE IDEAS
${adaptation.differentiation.map((t: string) => `- ${t}`).join("\n")}

## THUMBNAIL CONCEPTS / KEYFRAMES
${loopAssets.imagePrompts.map((img: any) => `### ${img.scene}\n> Midjourney: \`${img.midjourney}\``).join("\n\n")}

## VIDEO PROMPTS
${loopAssets.videoPrompts.map((v: any) => `- [${v.action}] Meta AI: \`${v.runway}\``).join("\n")}

## MUSIC PROMPTS (Tunee.ai)
${loopAssets.musicPrompts.map((m: any) => `- [${m.style}] Tunee: \`${m.prompt}\``).join("\n")}

---
*Generated by Neuro-Code Genesis Engine (Adaptation: ${duration})*
`.trim();

    items[itemIndex].blueprint = newBlueprintContent;
    await fs.writeFile(filePath, JSON.stringify(items, null, 2));

    revalidatePath("/notebook");
    revalidatePath("/notebook");
    revalidatePath(`/notebook/item/${id}`);
}

import { generateOptimization } from "@/lib/agents/youtube-optimizer";

export async function generateNotebookDistributionAction(id: string) {
    const filePath = path.join(process.cwd(), "src/data/notebook.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(fileContent) as NotebookItem[];

    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) throw new Error("Item not found");
    const item = items[itemIndex];

    // Extract Script
    const blueprintText = item.blueprint || "";
    // Try to find the Production Script first, fallback to Master
    const script = blueprintText.match(/## VOICEOVER SCRIPT \(Google AI Studio\)\n([\s\S]*?)(\n##|$)/)?.[1]?.trim()
        || blueprintText.match(/## VOICEOVER SCRIPT\n([\s\S]*?)(\n##|$)/)?.[1]?.trim();

    if (!script) throw new Error("No script found to optimize. Please generate a script first.");

    // Generate Distribution Package
    const optimization = await generateOptimization(script, 'all');

    if (!optimization) throw new Error("Optimization failed.");

    // Format new section
    const distributionSection = `
## DISTRIBUTION PACKAGE
### Dateiname (SEO-Optimiert)
> Primary: \`${optimization.filename?.primary}\`
> Alternatives: ${optimization.filename?.alternatives.join(", ")}
> Reasoning: ${optimization.filename?.reasoning}

### Titel (Primary + Alternatives)
> Primary: \`${optimization.title?.primary}\`
> Psychology: ${optimization.title?.psychology}
> Alternatives:
${optimization.title?.alternatives.map(t => `- ${t}`).join("\n")}

### Beschreibung (Mit Hooks & Keywords)
\`\`\`
${optimization.description?.description}
\`\`\`

### Tags (Strategisch sortiert)
\`${optimization.tags?.tags}\`
> Strategy: ${optimization.tags?.strategy}
`;

    // Remove existing Distribution section if any (and Metadata section if we are replacing it, but user said 'also', though 'Metadata' tab is being renamed)
    // We will replace any existing DISTRIBUTION PACKAGE section
    const parts = blueprintText.split("## DISTRIBUTION PACKAGE");
    let newBlueprint = parts[0].trim() + "\n\n" + distributionSection.trim();

    // If we want to preserve things AFTER... but usually it's at the end. 
    // If there was a footer, we might lose it, but the footer is generated.
    // Let's just ensure we append cleanly.

    items[itemIndex].blueprint = newBlueprint;
    await fs.writeFile(filePath, JSON.stringify(items, null, 2));

    revalidatePath("/notebook");
    revalidatePath(`/notebook/item/${id}`);
}

export async function reorderNotebookItemAction(id: string, direction: "up" | "down"): Promise<void> {
    await reorderNotebookItem(id, direction);
    revalidatePath("/notebook");
}

export async function saveNotebookOrderAction(items: NotebookItem[]): Promise<void> {
    await saveNotebookItems(items);
    revalidatePath("/notebook"); // Ensure UI updates
}


// Notebook Config Actions
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
export async function startGenesisAction(item: NotebookItem): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        console.log(`[Genesis] Starting automation for: ${item.title}`);

        const context = `
PROJECT TITLE: ${item.title}
DESCRIPTION: ${item.description || "No description provided."}
TAGS: ${item.tags?.join(", ") || "None"}

INSTRUCTION: Create a Viral Video Blueprint for this concept.
        `.trim();

        const blueprint = await generateBlueprint(context, item.title, "DE", undefined, {
            "ROLE": "You are the Genesis Engine. You take a raw idea and expand it into a full production blueprint."
        });

        // 2. Generate Image Prompts (Legacy)
        const imagePromptsResults = await generateImagePrompts(item.title);

        // 2b. Generate Loop Assets (Shorts Mode)
        const loopAssets = await generateViralLoopAssets(item.title, item.description, blueprint.original.hook);


        // 3. File System Operations
        const safeTitle = item.title.replace(/[^a-z0-9äöüß]/gi, '_').replace(/_+/g, '_');
        const teaserDir = path.join("/Users/remo.stiefel/Desktop/NeuroCode_Teasers", safeTitle);

        await fs.mkdir(teaserDir, { recursive: true });

        // Write Blueprint
        const blueprintContent = `
# ${item.title}
> Status: ${item.status} | Priority: ${item.priority}

## MASTER HOOK (ENGLISH)
${blueprint.original.hook}

## MASTER TWIST (ENGLISH)
${blueprint.original.twist}

## MASTER STRATEGY (ENGLISH)
${blueprint.analysis}

## MASTER STRUCTURE (ENGLISH)
${blueprint.original.structure.map(s => `- ${s}`).join("\n")}

## MASTER GENIUS (ENGLISH)
${blueprint.original.geniusElements.map(e => `- ${e}`).join("\n")}

## VIRAL HOOK (DEUTSCH)
${blueprint.adaptation.hook}

## CORE VALUE (DEUTSCH)
${blueprint.adaptation.germanTwist}

## VOICEOVER SCRIPT (Google AI Studio)
${blueprint.adaptation.voiceOverScript || "No script generated."}

## SCRIPT OUTLINE (DEUTSCH)
${blueprint.adaptation.structure.map(s => `- ${s}`).join("\n")}

## TITLE IDEAS
${blueprint.adaptation.differentiation.map(t => `- ${t}`).join("\n")}

## THUMBNAIL CONCEPTS / KEYFRAMES
${loopAssets.imagePrompts.map((img: any) => `### ${img.scene}\n> Midjourney: \`${img.midjourney}\``).join("\n\n")}

## VIDEO PROMPTS (Meta.ai)
${loopAssets.videoPrompts.map((v: any) => `- [${v.action}] Meta AI: \`${v.runway}\``).join("\n")}

## MUSIC PROMPTS (Tunee.ai)
${loopAssets.musicPrompts.map((m: any) => `- [${m.style}] Tunee: \`${m.prompt}\``).join("\n")}

---
*Generated by Neuro-Code Genesis Engine*
        `.trim();

        await fs.writeFile(path.join(teaserDir, "blueprint.md"), blueprintContent, "utf-8");

        // SAVE TO NOTEBOOK ITEM (In-App Access)
        await updateNotebookItem(item.id, { blueprint: blueprintContent });

        // Write Metadata/Prompts
        const metadata = {
            id: item.id,
            origin: "Notebook",
            timestamp: new Date().toISOString(),
            legacyPrompts: imagePromptsResults,
            assets: loopAssets
        };

        await fs.writeFile(path.join(teaserDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf-8");

        // Also save explicit prompts.json for easier copy-paste
        await fs.writeFile(path.join(teaserDir, "prompts.json"), JSON.stringify(loopAssets, null, 2), "utf-8");

        console.log(`[Genesis] Assets saved to: ${teaserDir}`);
        revalidatePath("/notebook");
        return { success: true, path: teaserDir };

    } catch (e: any) {
        console.error("[Genesis] Failed:", e);
        return { success: false, error: e.message };
    }
}

// Utils
export async function fetchVideoMetadataAction(videoId: string) {
    const { getVideoBasicInfoFallback, getVideoMetadata } = await import("@/lib/youtube");

    // 1. Try Full API (for Description)
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
        try {
            const fullData = await getVideoMetadata(videoId, apiKey);
            if (fullData) {
                return {
                    title: fullData.title,
                    author: fullData.channelTitle,
                    description: fullData.description
                };
            }
        } catch (e) {
            console.warn("Full API Fetch failed, falling back to oEmbed", e);
        }
    }

    // 2. Fallback (Title Only)
    return await getVideoBasicInfoFallback(videoId);
}

export async function synthesizeNotebookThemesAction(): Promise<{ success: true } | { success: false }> {
    try {
        const { synthesizeNotebookThemes } = await import("@/lib/gemini");
        const items = await getNotebookItems();

        // Only cluster "Idea" and "Researching" items (Topic type)
        const relevantItems = items.filter(i => i.type === "topic" && !i.isArchived);

        if (relevantItems.length < 3) return { success: false }; // Need critical mass

        const updates = await synthesizeNotebookThemes(items);

        // Apply updates
        for (const update of updates) {
            await updateNotebookItem(update.id, {
                cluster: update.cluster,
                coreMessage: update.coreMessage,
                // We also add the cluster as a tag for easy filtering
                tags: [...(items.find(i => i.id === update.id)?.tags || []), update.cluster].filter((v, i, a) => a.indexOf(v) === i)
            });
        }

        revalidatePath("/notebook");
        return { success: true };
    } catch (e) {
        console.error("Theme Synthesis Failed", e);
        return { success: false };
    }
}
