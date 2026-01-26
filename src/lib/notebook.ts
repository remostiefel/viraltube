import fs from "fs/promises";
import path from "path";
import {
    NotebookItem,
    NotebookItemType,
    TOPIC_STATUSES,
    STEP_STATUSES
} from "./notebook-types";

// Re-export types for backward compatibility in server files if needed, 
// strictly server-side usage though.
export * from "./notebook-types";

const NOTEBOOK_FILE = path.join(process.cwd(), "src", "data", "notebook.json");

// Ensure file exists
async function ensureFile() {
    try {
        await fs.access(NOTEBOOK_FILE);
    } catch {
        await fs.mkdir(path.dirname(NOTEBOOK_FILE), { recursive: true });
        await fs.writeFile(NOTEBOOK_FILE, "[]", "utf-8");
    }
}

export async function getNotebookItems(): Promise<NotebookItem[]> {
    await ensureFile();
    const data = await fs.readFile(NOTEBOOK_FILE, "utf-8");
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

export async function createNotebookItem(
    type: NotebookItemType,
    title: string,
    description: string = "",
    priority: "low" | "medium" | "high" = "medium",
    tags: string[] = []
): Promise<NotebookItem> {
    await ensureFile();
    const items = await getNotebookItems();

    const initialStatus = type === "topic" ? TOPIC_STATUSES[0] : STEP_STATUSES[0];

    const newItem: NotebookItem = {
        id: crypto.randomUUID(),
        type,
        title,
        description,
        status: initialStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags,
        priority,
        isArchived: false,
    };

    items.unshift(newItem);
    await fs.writeFile(NOTEBOOK_FILE, JSON.stringify(items, null, 2), "utf-8");
    return newItem;
}

export async function updateNotebookItem(id: string, updates: Partial<NotebookItem>): Promise<NotebookItem | null> {
    await ensureFile();
    const items = await getNotebookItems();

    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await fs.writeFile(NOTEBOOK_FILE, JSON.stringify(items, null, 2), "utf-8");
    return items[index];
}

export async function deleteNotebookItem(id: string): Promise<void> {
    await ensureFile();
    const items = await getNotebookItems();
    const filtered = items.filter(item => item.id !== id);
    await fs.writeFile(NOTEBOOK_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}

export async function saveNotebookItems(items: NotebookItem[]): Promise<void> {
    await ensureFile();
    await fs.writeFile(NOTEBOOK_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function reorderNotebookItem(id: string, direction: "up" | "down"): Promise<NotebookItem[]> {
    await ensureFile();
    const items = await getNotebookItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return items;

    const item = items[index];

    // Find target index - nearest item with same status AND type (since UI separates them)
    // Actually the UI filters by type (activeTab) AND status.
    // So we must respect both.
    // Also respect 'isArchived' view mode? 
    // Usually reordering is done in the active list. 
    // If we reorder archived items, we should look for archived neighbors.

    let targetIndex = -1;

    if (direction === "up") {
        for (let i = index - 1; i >= 0; i--) {
            if (
                items[i].status === item.status &&
                items[i].type === item.type &&
                items[i].isArchived === item.isArchived
            ) {
                targetIndex = i;
                break;
            }
        }
    } else {
        for (let i = index + 1; i < items.length; i++) {
            if (
                items[i].status === item.status &&
                items[i].type === item.type &&
                items[i].isArchived === item.isArchived
            ) {
                targetIndex = i;
                break;
            }
        }
    }

    if (targetIndex !== -1) {
        // Remove item
        items.splice(index, 1);
        // Insert at target index
        // Note: existing logic analysis confirms usage of targetIndex for both directions works
        // because of how indices shift when removing "index".
        // If direction is DOWN: targetIndex > index. Removal shifts targetIndex down by 1.
        // We want to insert AFTER target. So (targetIndex-1) + 1 = targetIndex.
        // If direction is UP: targetIndex < index. Removal doesn't affect targetIndex.
        // We want to insert BEFORE target. So targetIndex.
        // Yes, splicing at `targetIndex` works for both.
        items.splice(targetIndex, 0, item);

        await fs.writeFile(NOTEBOOK_FILE, JSON.stringify(items, null, 2), "utf-8");
        return items;
    }

    return items;
}
