import fs from "fs/promises";
import path from "path";
import { GeneratedScript } from "@/lib/openai";

const PROJECTS_FILE = path.join(process.cwd(), "src", "data", "projects.json");

export interface Project {
    id: string;
    title: string;
    createdAt: string;
    status: "draft" | "production" | "done" | "archived";
    format?: string; // Content structure from a Template
    description?: string; // Added for Trendjack fallback
    // Links to other artifacts
    scriptId?: string;
    viralAnalysisId?: string;

    // Direct Content Storage (The "Single Source of Truth")
    scriptContent?: string;
    scriptData?: GeneratedScript;
}

// Ensure file exists
async function ensureFile() {
    try {
        await fs.access(PROJECTS_FILE);
    } catch {
        // Ensure directory exists too just in case
        await fs.mkdir(path.dirname(PROJECTS_FILE), { recursive: true });
        await fs.writeFile(PROJECTS_FILE, "[]", "utf-8");
    }
}

export async function getProjects(): Promise<Project[]> {
    await ensureFile();
    const data = await fs.readFile(PROJECTS_FILE, "utf-8");
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

export async function getProjectById(id: string): Promise<Project | undefined> {
    const projects = await getProjects();
    return projects.find(p => p.id === id);
}

export async function createProject(title?: string, format?: string, id?: string): Promise<Project> {
    await ensureFile();
    const projects = await getProjects();

    const dateStr = new Date().toISOString().split('T')[0];
    const newProject: Project = {
        id: id || crypto.randomUUID(), // Use provided ID or generate new
        title: title || `Video Project ${dateStr}`,
        createdAt: new Date().toISOString(),
        status: "production",
        format
    };

    // Add to beginning of list (newest first)
    projects.unshift(newProject);

    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await ensureFile();
    const projects = await getProjects();

    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = { ...projects[index], ...updates };

    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return projects[index];
}

export async function deleteProject(id: string): Promise<void> {
    await ensureFile();
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}
