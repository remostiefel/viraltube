
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const BRAIN_BUILD_PATH = path.join(process.cwd(), 'src/data/brain-build.json');
const NOTEBOOK_PATH = path.join(process.cwd(), 'src/data/notebook.json');

type BrainBuildBeat = {
    id: string;
    date: string;
    title: string;
    content: string;
    type: string;
    icon: string;
    codeSnippet?: string;
};

type NotebookItem = {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    updatedAt: string;
};

function getTodayStr(): string {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
}

export async function checkAndRecordDailyProgress() {
    // Only run on server
    if (typeof window !== 'undefined') return;

    try {
        const brainBuildData: BrainBuildBeat[] = JSON.parse(fs.readFileSync(BRAIN_BUILD_PATH, 'utf-8'));
        const lastBeat = brainBuildData[brainBuildData.length - 1];
        const todayStr = getTodayStr();

        // 1. Check if already updated today
        if (lastBeat && lastBeat.date === todayStr) {
            // Already recorded for today
            return;
        }

        // 2. Gather updates from Notebook
        let notebookUpdates: string[] = [];
        if (fs.existsSync(NOTEBOOK_PATH)) {
            const notebookData: NotebookItem[] = JSON.parse(fs.readFileSync(NOTEBOOK_PATH, 'utf-8'));
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const doneToday = notebookData.filter(item => {
                const updated = new Date(item.updatedAt);
                return item.status === 'Done' && updated >= todayStart;
            });

            notebookUpdates = doneToday.map(item => item.title);
        }

        // 3. Gather updates from Git (if available)
        let gitSummary = "";
        try {
            const { stdout } = await execPromise('git log --since="24 hours ago" --pretty=format:"%s"');
            const commits = stdout.split('\n').filter(Boolean);
            if (commits.length > 0) {
                gitSummary = `Codebase evolved with ${commits.length} commits.`;
            }
        } catch (e) {
            // Git might not be available or no commits
        }

        // 4. Determine if there's "Essential Progress"
        if (notebookUpdates.length === 0 && !gitSummary) {
            return; // No news is good news, but no entry needed
        }

        // 5. Construct New Beat
        // "Antigravity" persona text generation (Rule-based for now)
        const id = `beat-${Date.now()}`; // Unique ID
        let title = "System Evolution";
        let content = "The system continues to optimize.";
        let type = "DEV";
        let icon = "cpu";
        let codeSnippet = "";

        if (notebookUpdates.length > 0) {
            title = "Task Completion";
            type = "FEAT";
            icon = "check-circle";
            const tasksStr = notebookUpdates.slice(0, 3).join(", ");
            const remaining = notebookUpdates.length > 3 ? `, and ${notebookUpdates.length - 3} others` : "";
            content = `We successfully executed the following protocols: ${tasksStr}${remaining}. The mission trajectory is nominal.`;
            codeSnippet = `Tasks.complete([${notebookUpdates[0]}...])`;
        } else if (gitSummary) {
            title = "Codebase Refactoring";
            type = "DEV";
            icon = "git-commit";
            content = `${gitSummary} Internal logic structures have been fortified.`;
            codeSnippet = "git push origin main";
        }

        // Combine if both
        if (notebookUpdates.length > 0 && gitSummary) {
            title = "Daily Synchronization";
            content = `${gitSummary} We also finalized key objectives: ${notebookUpdates.slice(0, 2).join(", ")}.`;
            type = "SYNC";
            icon = "refresh-cw";
        }

        const newBeat: BrainBuildBeat = {
            id,
            date: todayStr,
            title,
            content,
            type,
            icon,
            codeSnippet
        };

        // 6. Write to File
        brainBuildData.push(newBeat);
        fs.writeFileSync(BRAIN_BUILD_PATH, JSON.stringify(brainBuildData, null, 4));
        console.log(`[BrainBuild] Auto-recorded progress for ${todayStr}`);

        // 7. Auto-complete the manual task if it exists
        if (fs.existsSync(NOTEBOOK_PATH)) {
            const notebookData: NotebookItem[] = JSON.parse(fs.readFileSync(NOTEBOOK_PATH, 'utf-8'));
            let modified = false;
            notebookData.forEach(item => {
                if (item.title.toLowerCase().includes('update brain build') && item.status !== 'Done') {
                    item.status = 'Done';
                    item.updatedAt = new Date().toISOString();
                    modified = true;
                }
            });
            if (modified) {
                fs.writeFileSync(NOTEBOOK_PATH, JSON.stringify(notebookData, null, 2));
            }
        }

    } catch (error) {
        console.error("[BrainBuild] Error auto-recording progress:", error);
    }
}
