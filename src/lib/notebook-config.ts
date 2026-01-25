import fs from "fs/promises";
import path from "path";
import { NotebookConfig } from "./notebook-config-types";

// Re-export types for convenience (server-side only users)
export * from "./notebook-config-types";

const CONFIG_FILE = path.join(process.cwd(), "src", "data", "notebook-config.json");

async function ensureConfigFile() {
    try {
        await fs.access(CONFIG_FILE);
    } catch {
        await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
        const initialConfig: NotebookConfig = { tagColors: {} };
        await fs.writeFile(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), "utf-8");
    }
}

export async function getNotebookConfig(): Promise<NotebookConfig> {
    await ensureConfigFile();
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    try {
        return JSON.parse(data);
    } catch {
        return { tagColors: {} };
    }
}

export async function updateTagColor(tag: string, color: string): Promise<NotebookConfig> {
    await ensureConfigFile();
    const config = await getNotebookConfig();

    config.tagColors[tag] = color;

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return config;
}

export async function saveNotebookConfig(config: NotebookConfig): Promise<void> {
    await ensureConfigFile();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
