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
    },
    {
        id: "neuro_loop_paradox",
        name: "♻️ The Paradox Loop (Shorts)",
        description: "High Retention. The end sentence completes the first sentence. Best for debunking common myths.",
        structure: [
            { beat: "The Hook", timing: "0-2s", instruction: "State a provocative, counter-intuitive truth. (e.g. 'Sugar is not food.')" },
            { beat: "The Interrupt", timing: "2-5s", instruction: "Immedidate negation or perspective shift. ('It is a signal.')" },
            { beat: "The Neuro-Claim", timing: "5-10s", instruction: "Scientific explanation without the full solution. Create a gap." },
            { beat: "The Twist", timing: "10-12s", instruction: "Recontextualize the hook concept." },
            { beat: "The Loop Link", timing: "12-15s", instruction: "End with a sentence that grammatically flows into the Hook. (e.g. 'And that is why...')" }
        ],
        systemPromptAddon: "Create a PERFECT VERBAL LOOP. The last sentence MUST be an incomplete thought that is completed by the first sentence of the video. No intro/outro fluff."
    },
    {
        id: "neuro_loop_gap",
        name: "♻️ The Cognitive Gap (Shorts)",
        description: "Creates an 'open loop' that forces a re-watch. Focuses on 'What nobody tells you'.",
        structure: [
            { beat: "The Missing Piece", timing: "0-3s", instruction: "'Here is the one thing nobody tells you about [Topic]...'" },
            { beat: "The Context", timing: "3-8s", instruction: "Why standard advice fails. Build tension." },
            { beat: "The Partial Reveal", timing: "8-12s", instruction: "Give the component, but not the implementation." },
            { beat: "The Gap", timing: "12-15s", instruction: "'But it only works if you understand...'" }
        ],
        systemPromptAddon: "You are creating a 'Knowledge Gap'. Reveal the 'What' but hide the 'How' behind a loop. The start of the video provides the 'How' context."
    },
    {
        id: "neuro_loop_visual",
        name: "♻️ The Visual Reset (Shorts)",
        description: "Relies on an identical visual state at start and end. Great for 'Process' or 'Reset' topics.",
        structure: [
            { beat: "State A (Start)", timing: "0-3s", instruction: "Describe the 'Before' state (visually). High contrast." },
            { beat: "The Process", timing: "3-10s", instruction: "Rapid visual transformation or explanation." },
            { beat: "The Insight", timing: "10-13s", instruction: "The realizaton of why we are back here." },
            { beat: "State A (Return)", timing: "13-15s", instruction: "End with 'And we simply go back to...' or visual cue reset." }
        ],
        systemPromptAddon: "Focus on VISUAL DESCRIPTIONS in the 'VisualCue' fields. The first and last visual cues MUST be identical to create a seamless visual loop."
    }
];

export function getProtocolById(id: string): ScriptProtocol | undefined {
    return VIRAL_PROTOCOLS.find(p => p.id === id);
}
