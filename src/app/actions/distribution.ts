"use server";

import { generateOptimization, YoutubeOptimizerResult } from "@/lib/agents/youtube-optimizer";

export async function optimizeVideoMetadataAction(
    script: string,
    type: 'all' | 'filename' | 'title' | 'description' | 'tags'
): Promise<YoutubeOptimizerResult | null> {
    return await generateOptimization(script, type);
}
