export interface HelpItem {
    title: string;
    module: string;
    tagline: string;
    concept: string;
    workflow: string[];
    opportunity: string;
}

export const HELP_CONTENT: Record<string, HelpItem> = {
    // --- DASHBOARD ---
    "dashboard.bio-os": {
        title: "Bio-Optimization System",
        module: "DASHBOARD",
        tagline: "Maximize Creative Energy",
        concept: "The foundation of Neuro-Code. Before you code or create, you must optimize your biological hardware (your brain). This section tracks your physical readiness.",
        workflow: [
            "Check your 'Bio-State' daily using The Upgrade protocol.",
            "Use 'Neuro-Sync' for 15-min binaural beat priming before deep work.",
            "Aim for the 'Optimized' state to unlock maximum creativity."
        ],
        opportunity: "Operating in an 'Optimized' state increases code quality by ~40% and reduces burnout. Don't skip the biology."
    },
    "dashboard.visualizer": {
        title: "Glass Brain Visualizer",
        module: "DASHBOARD",
        tagline: "Real-time Neural State",
        concept: "A real-time reflection of your system's status. The colors and activity levels correspond to your current creative momentum and biological readiness.",
        workflow: [
            "Blue/Calm: Idle state. Good for research.",
            "Gold/Active: High energy. Good for execution.",
            "Red/Warning: Potential burnout. Take a break."
        ],
        opportunity: "Use this visual feedback loop to time your hardest tasks when the brain is glowing Gold."
    },
    "dashboard.production": {
        title: "Production Cortex",
        module: "DASHBOARD",
        tagline: "Idea-to-Video Pipeline",
        concept: "The engine room for content creation. This is where raw ideas are processed into finished scripts and videos.",
        workflow: [
            "Scanner: Input raw urls or ideas.",
            "Script Forge: Structure them into narratives.",
            "Director: Visualize the scenes."
        ],
        opportunity: "The pipeline is designed to be linear. Moving strictly from Scanner -> Archive -> Director prevents 'writer's block' by separating concerns."
    },

    // --- MODULES ---
    "upgrade.protocol": {
        title: "The Upgrade Protocol",
        module: "BIO-OS",
        tagline: "15-min Neuro-Priming",
        concept: "A 15-minute guided audio-visual priming session designed to shift brainwaves from Beta (stress) to Alpha/Theta (flow).",
        workflow: [
            "Put on headphones (Essential).",
            "Click 'Start Protocol' and close your eyes when instructed.",
            "Do not multitask during the upload."
        ],
        opportunity: "Doing this immediately before a coding sprint acts as a 'context switch', clearly separating leisure time from high-performance work time."
    },
    "scanner.input": {
        title: "Trend Scanner",
        module: "SCANNER",
        tagline: "Trend & Pattern Scout",
        concept: "Your external eyes and ears. This tool scrapes YouTube, Blogs, and Papers to find high-performing topics and 'Outliers'.",
        workflow: [
            "Paste a URL from a competitor or inspiration source.",
            "Let the AI extract the 'Core Hook' and 'Viral Mechanics'.",
            "Save interesting finds to the Wisdom Vault."
        ],
        opportunity: "Don't just copy. Use the scanner to find the 'Gap' - what are they NOT saying? That's your content opportunity."
    },
    "architect.frameworks": {
        title: "Narrative Frameworks",
        module: "ARCHITECT",
        tagline: "Pre-built Viral Structures",
        concept: "Pre-built structural templates for high-retention storytelling. Based on classic structures like 'Hero's Journey' or 'Problem-Agitate-Solve'.",
        workflow: [
            "Select a framework that matches your video goal.",
            "Fill in the beats (steps) with your specific content.",
            "The AI will smooth out the transitions."
        ],
        opportunity: "Using a framework guarantees pacing. Most retention drops happen because the structure failed, not the content."
    },
    "architect.strategy": {
        title: "Strategy Forge",
        module: "ARCHITECT",
        tagline: "Title & Thumbnail Design",
        concept: "The 'Why' before the 'What'. Defines the video's Core Concept, Target Audience, and Thumbnail Angle before a single word of script is written.",
        workflow: [
            "Use the 'Genesis' mode to emulate a proven viral hit.",
            "Or refine your raw idea into a 'Title & Thumbnail' concept first.",
            "Save this as a valid Strategy before moving to the Script Builder."
        ],
        opportunity: "A great script cannot save a bad concept. Spend 80% of your time here."
    },
    "architect.builder": {
        title: "Script Builder",
        module: "ARCHITECT",
        tagline: "Block-based Script Editor",
        concept: "The 'How'. A block-based editor where you construct the actual spoken content and visual cues.",
        workflow: [
            "Use 'Slash Commands' (e.g., /visual) to insert direction.",
            "Keep paragraphs short (under 50 words) for readability.",
            "Use the 'Neuro-Score' button to check for dopamine spikes."
        ],
        opportunity: "Don't write an essay. Write a visual sequence. Does the image match the word?"
    },
    "wisdom.hub": {
        title: "Wisdom Hub",
        module: "KNOWLEDGE",
        tagline: "Knowledge Storage",
        concept: "Your long-term memory. Stores quotes, concepts, and hooks extracted from the Scanner or entered manually.",
        workflow: [
            "Tag every entry with at least one 'Theme'.",
            "Use the 'Combine' feature to merge two distinct ideas into a novel one.",
            "Drag and drop nuggets directly into the Script Forge."
        ],
        opportunity: "True creativity is connecting unconnected dots. The Wisdom Hub is designed to force these collisions."
    },
    "wisdom.synthesis": {
        title: "Synthesis Workbench",
        module: "KNOWLEDGE",
        tagline: "Create New Principles",
        concept: "The Alchemist's Table. Takes raw information (Facts) and transmutes it into Higher Wisdom (Laws/Principles).",
        workflow: [
            "Select 2-3 related nuggets from the pool.",
            "Click 'Compare & Merge' to identify the underlying pattern.",
            "Save the result as a new 'Master Principle'."
        ],
        opportunity: "This is how you create original thought. By finding the common denominator between disparate sources."
    }
};
