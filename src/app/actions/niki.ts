"use server";

import { NikiGenerator, NikiOptions, NikiScript } from "@/lib/niki/generator";

export async function generateNikiScriptAction(options: NikiOptions): Promise<NikiScript | null> {
    const generator = new NikiGenerator();
    return await generator.generate30sLoop(options);
}
