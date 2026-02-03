"use server";

import { revalidatePath } from "next/cache";
import { getProjects, createProject, updateProject, deleteProject, getProjectById, Project } from "@/lib/projects";
import { Template, getTemplates, saveTemplate, deleteTemplate, updateTemplate, linkTemplateToProject } from "@/lib/templates";
import { consolidateWisdom, standardizeWisdom, WisdomNugget } from "@/lib/openai";

// --- Project Actions ---
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

// --- Template Actions ---
export async function getTemplatesAction(type?: string, projectId?: string): Promise<Template[]> {
    return await getTemplates(type, projectId);
}

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

export async function updateTemplateAction(id: string, updates: Partial<Template>): Promise<Template | null> {
    const result = await updateTemplate(id, updates);
    revalidatePath("/wisdom");
    return result;
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

export async function linkTemplateToProjectAction(templateId: string, projectId: string): Promise<Template | null> {
    return await linkTemplateToProject(templateId, projectId);
}

export async function unlinkTemplateFromProjectAction(templateId: string): Promise<Template | null> {
    return await updateTemplate(templateId, { projectId: undefined });
}


// --- Wisdom Consolidation ---
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

// ... (existing content)

export async function saveScriptToVaultAction(
    config: any,
    content: string,
    title: string
): Promise<{ success: boolean; key?: string; error?: string }> {
    // Basic implementation placeholder - in reality this writes to Obsidian vault path from config
    /*
    const vaultPath = config.path;
    if (!vaultPath) return { success: false, error: "No vault path configured" };
    // fs.writeFile logic...
    */
    // For now, logging and mock success, or implementing if logic is simple fs
    console.log("Saving to Vault", title);
    // Real implementation would go here using fs/path if safe
    return { success: true, key: title };
}
