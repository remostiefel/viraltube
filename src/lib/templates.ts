import fs from "fs/promises";
import path from "path";

const TEMPLATE_FILE = path.join(process.cwd(), "src", "data", "templates.json");

export interface Template {
    id: string;
    type: "script" | "prompt" | "visual" | "audio" | "viral-wisdom" | "necessity";
    name: string;
    content: any; // Can be GeneratedScript, ImagePrompt[], etc.
    createdAt: string;
    projectId?: string; // Link to a specific project
    versionStatus?: "draft" | "beta" | "final";
    tags?: string[];
    rating?: number; // 1-5 score
    wisdomCategory?: "LAW" | "FACT" | "GROWTH"; // Top-level categorization
}

// Ensure file exists
async function ensureFile() {
    try {
        await fs.access(TEMPLATE_FILE);
    } catch {
        await fs.mkdir(path.dirname(TEMPLATE_FILE), { recursive: true });
        await fs.writeFile(TEMPLATE_FILE, "[]", "utf-8");
    }
}

export async function getTemplates(type?: string, projectId?: string): Promise<Template[]> {
    await ensureFile();
    const data = await fs.readFile(TEMPLATE_FILE, "utf-8");
    let templates: Template[] = [];
    try {
        templates = JSON.parse(data);
    } catch (e) {
        templates = [];
    }

    if (type) {
        templates = templates.filter(t => t.type === type);
    }
    if (projectId) {
        templates = templates.filter(t => t.projectId === projectId);
    }
    return templates;
}

export async function saveTemplate(template: Omit<Template, "id" | "createdAt">): Promise<Template> {
    await ensureFile();
    const templates = await getTemplates();

    const newTemplate: Template = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    await fs.writeFile(TEMPLATE_FILE, JSON.stringify(templates, null, 2), "utf-8");
    return newTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
    await ensureFile();
    const templates = await getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await fs.writeFile(TEMPLATE_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}

export async function updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    await ensureFile();
    const templates = await getTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return null;

    const updatedTemplate = { ...templates[index], ...updates };
    templates[index] = updatedTemplate;

    await fs.writeFile(TEMPLATE_FILE, JSON.stringify(templates, null, 2), "utf-8");
    return updatedTemplate;
}

export async function linkTemplateToProject(templateId: string, projectId: string): Promise<Template | null> {
    return await updateTemplate(templateId, { projectId });
}
