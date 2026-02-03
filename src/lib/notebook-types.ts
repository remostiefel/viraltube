export type NotebookItemType = "topic" | "step";

// Topics: Content Pipeline (Idea -> Ready)
export const TOPIC_STATUSES = [
    "Idea",         // Raw thoughts
    "Researching",  // Gathering info
    "Scripting",    // Writing
    "Filming",      // Production
    "Polishing",    // Editing/Packaging
    "Ready"         // Done/Scheduled
] as const;

// Steps: App Development (Backlog -> Done)
export const STEP_STATUSES = [
    "Backlog",      // Future
    "Next",         // Queued
    "In Progress",  // Active
    "Review",       // Testing
    "Done"          // Completed
] as const;

export interface NotebookItem {
    id: string;
    type: NotebookItemType;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    priority: "low" | "medium" | "high";
    isArchived: boolean;
    completedAt?: string;
    formatId?: string; // Links to FormatRegistry
    blueprint?: string; // Markdown content of the generated script
    sourceUrl?: string; // Original Viral Source (YouTube)
    rating?: number; // 1-5 Star Rating
    cluster?: string; // AI-assigned Topic Cluster
    coreMessage?: string; // 1-Sentence Summary
}
