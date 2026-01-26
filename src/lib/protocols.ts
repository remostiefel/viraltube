export interface ScriptProtocol {
    id: string;
    name: string;
    description: string;
    structure: {
        beat: string;
        timing: string;
        instruction: string;
    }[];
    systemPromptAddon: string;
}

export const VIRAL_PROTOCOLS: ScriptProtocol[] = [
    {
        id: "storyteller",
        name: "The Storyteller (Epic)",
        description: "Best for documentaires, history, or personal stories. Focuses on emotion and transformation.",
        structure: [
            { beat: "In Media Res", timing: "0-5s", instruction: "Start in the middle of the action. No intro." },
            { beat: "The Stakes", timing: "5-15s", instruction: "Why does this matter? What is at risk?" },
            { beat: "The Journey", timing: "15-45s", instruction: "The process, the struggle, the discovery." },
            { beat: "The Climax", timing: "45-55s", instruction: "The realization or final result." },
            { beat: "The Twist/Lesson", timing: "55-60s", instruction: "Recontextualize the experience." }
        ],
        systemPromptAddon: "You are a Master Storyteller. Use 'The Hero's Journey' framework condensed into 60 seconds. Focus on sensory details and emotion."
    },
    {
        id: "contrarian",
        name: "The Contrarian (Debunk)",
        description: "Best for educational content, myth-busting, or controversial takes. High retention through conflict.",
        structure: [
            { beat: "The Myth", timing: "0-5s", instruction: "State a common belief everyone has." },
            { beat: "The Pattern Break", timing: "5-10s", instruction: "Tell them why they are wrong. 'Stop doing this.'" },
            { beat: "The Evidence", timing: "10-40s", instruction: "Scientific or logical proof. Fast facts." },
            { beat: "The New Way", timing: "40-55s", instruction: "The superior alternative." },
            { beat: "Call to Action", timing: "55-60s", instruction: "Binary choice: 'You can keep failing, or...'" }
        ],
        systemPromptAddon: "You are a specific, authoritative expert. Debunk common misconceptions. Be direct, slightly aggressive, but accurate."
    },
    {
        id: "quick_list",
        name: "The Quick List (Value)",
        description: "Best for tools, tips, or rapid-fire value. High save rate.",
        structure: [
            { beat: "The Promise", timing: "0-5s", instruction: "'Here are 3 ways to X...'" },
            { beat: "Item 1 (The Hook)", timing: "5-20s", instruction: "The most surprising one first." },
            { beat: "Item 2 (The Meat)", timing: "20-35s", instruction: "The most useful/practical one." },
            { beat: "Item 3 (The Secret)", timing: "35-55s", instruction: "The one nobody knows about." },
            { beat: "The Loop", timing: "55-60s", instruction: "Link back to start for perfect loop." }
        ],
        systemPromptAddon: "You are a concise curator. No fluff. Maximum value density. Use lists and clear steps."
    },
    {
        id: "step_by_step",
        name: "Step-by-Step (Tutorial)",
        description: "Clear, linear instruction for a specific result.",
        structure: [
            { beat: "The Result", timing: "0-5s", instruction: "Show the finished product first." },
            { beat: "Step 1", timing: "5-20s", instruction: "The setup." },
            { beat: "Step 2", timing: "20-40s", instruction: "The critical action." },
            { beat: "Step 3", timing: "40-55s", instruction: "The polish/reveal." },
            { beat: "The Payoff", timing: "55-60s", instruction: "Final validation." }
        ],
        systemPromptAddon: "You are a patient instructor. Be extremely clear. Focus on the 'How-To'."
    }
];

export function getProtocolById(id: string): ScriptProtocol | undefined {
    return VIRAL_PROTOCOLS.find(p => p.id === id);
}
