"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, MessageSquare, PencilRuler, FileText, Loader2, PlayCircle, Clock, Save, FolderOpen, Trash2, Eye, Binary, BrainCircuit, Activity, Cloud, Sparkles, Zap, Layout, CheckCircle2, Brain, FileDown, Clapperboard, Copy, Check, Maximize2, GraduationCap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { processChat, generateScriptAction, saveTemplateAction, getTemplatesAction, deleteTemplateAction, generateBlueprintAction, saveScriptToVaultAction, getProjectByIdAction, updateProjectAction, synthesizeStrategyAction, refineScriptAction, extendScriptAction, searchOutliersAction, generateVideoPromptsAction, generateImagePromptsAction, generateAudioPromptsAction, generateScriptImagePromptsAction } from "@/app/actions";
import { Project } from "@/lib/projects";
import { ChatMessage, StrategyProfile } from "@/lib/gemini";
import { GeneratedScript, WisdomNugget } from "@/lib/openai";
import { Template } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { NeuroScore } from "@/components/analysis/NeuroScore";
import { analyzePEOAction } from "@/app/actions";
import { PEOScore } from "@/lib/openai";
import { calculatePacingProfile, PacingDataPoint } from "@/lib/pacing";
import { RetentionGraph } from "@/components/analysis/RetentionGraph";
import { OraclePrediction } from "@/lib/oracle";
import { predictPerformanceAction } from "@/app/actions";
import { OracleCard } from "@/components/analysis/OracleCard";
import { TemplateManager } from "@/components/architect/TemplateManager";
// Removed static import of saveAs to prevent build issues
// import { saveAs } from "file-saver";

import { generateDocx, generatePromptsDocx, generateImagePromptsDocx, generateAudioPromptsDocx } from "@/lib/docx-exporter";
import { VideoPrompt, ScriptImagePrompt, AudioPrompt } from "@/lib/openai";
import { SnapshotButton } from "@/components/SnapshotButton";
import { VIRAL_PROTOCOLS } from "@/lib/protocols";





export const dynamic = "force-dynamic";

export default function ArchitectPage() {
    return (
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
            <React.Suspense fallback={<div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-muted-foreground text-sm">Loading Architect...</p></div>}>
                <ArchitectContent />
            </React.Suspense>
        </div>
    );
}

function ArchitectContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("project");
    const templateId = searchParams.get("templateId"); // Support direct loading

    // Strategy Forge State
    const [strategyProject, setStrategyProject] = useState<Project | null>(null);
    const [strategyContent, setStrategyContent] = useState("");
    const [isStrategiesMode, setIsStrategiesMode] = useState(false);
    const [analyzingStrategy, setAnalyzingStrategy] = useState(false);
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);

    // Load Cortex Profile
    useEffect(() => {
        const stored = localStorage.getItem("nc_cortex_profile");
        if (stored) {
            setCortexProfile(JSON.parse(stored));
        }
    }, []);

    const [refiningScript, setRefiningScript] = useState(false);
    const [extendingScript, setExtendingScript] = useState(false);
    const [savingStrategyStatus, setSavingStrategyStatus] = useState<"idle" | "saving" | "saved">("idle");

    const [savingBlueprintStatus, setSavingBlueprintStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [saveCategory, setSaveCategory] = useState<"LAW" | "FACT" | "GROWTH">("GROWTH");
    const [activeBlueprintName, setActiveBlueprintName] = useState<string | null>(null);

    const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[] | null>(null);

    // Genesis Mode State
    const [genesisMode, setGenesisMode] = useState(false);
    const [genesisStatus, setGenesisStatus] = useState<"IDLE" | "SEARCHING" | "ANALYZING" | "WRITING" | "IMAGINING" | "DONE">("IDLE");
    const [genesisLogs, setGenesisLogs] = useState<string[]>([]);
    const [generatingPrompts, setGeneratingPrompts] = useState(false);
    const [savingPrompts, setSavingPrompts] = useState<"idle" | "saving" | "saved">("idle");
    const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

    // Image/Audio State
    const [imagePrompts, setImagePrompts] = useState<ScriptImagePrompt[] | null>(null);
    const [audioPrompts, setAudioPrompts] = useState<AudioPrompt | null>(null);
    const [generatingImages, setGeneratingImages] = useState(false);
    const [savingImages, setSavingImages] = useState<"idle" | "saving" | "saved">("idle");
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [savingAudio, setSavingAudio] = useState<"idle" | "saving" | "saved">("idle");

    // Wisdom Hub Integration
    const [wisdomTemplates, setWisdomTemplates] = useState<Template[]>([]);
    const [selectedWisdomIds, setSelectedWisdomIds] = useState<string[]>([]);
    const [autoIncludeHighImpact, setAutoIncludeHighImpact] = useState(false);

    // Load wisdom on mount
    useEffect(() => {
        getTemplatesAction("viral-wisdom").then(setWisdomTemplates);
    }, []);

    const [activeTab, setActiveTab] = useState<"chat" | "script" | "strategy" | "director" | "visuals" | "audio">("strategy"); // Updated types

    useEffect(() => {
        if (projectId) {
            loadStrategyProject(projectId);
        }
    }, [projectId]);

    // Added: Load specific template if ID is provided
    useEffect(() => {
        if (templateId) {
            loadSpecificTemplate(templateId);
        }
    }, [templateId]);

    // Handle deep-linking to tabs
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && ["strategy", "script", "visuals", "director", "audio", "chat"].includes(tabParam)) {
            // @ts-ignore
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const loadSpecificTemplate = async (id: string) => {
        // We reuse getTemplatesAction but we need to find the specific one.
        // Optimized: In a real app we'd have getTemplateByIdAction.
        // For now, we fetch all (cached usually) and find it.
        const all = await getTemplatesAction();
        const target = all.find(t => t.id === id);
        if (target) {
            handleLoadTemplate(target);
        }
    };

    const loadStrategyProject = async (id: string) => {
        const project = await getProjectByIdAction(id);
        if (project) {
            setStrategyProject(project);

            // 1. Load Strategy Context
            setStrategyContent(project.format || project.description || "");

            // 2. Load Script Content (The Single Source of Truth)
            if (project.scriptContent) {
                setContent(project.scriptContent);
                setStep("write"); // Go straight to editor
            }

            // 3. Load Structured Data if available
            if (project.scriptData) {
                setScriptResult(project.scriptData);
                const pacing = calculatePacingProfile(project.scriptData);
                setPacingData(pacing);
            }

            setIsStrategiesMode(true);

            // If we have content, default to Builder tab, else Strategy
            if (project.scriptContent) {
                setActiveTab("script");
            } else {
                setActiveTab("strategy");
            }

            // Set Active Blueprint Name from Project Title if meaningful
            if (project.title && !project.title.includes("Video Project")) {
                setActiveBlueprintName(project.title.replace("Combo: ", ""));
            }
        }
    };

    // Auto-fill Script Topic from Strategy Project
    useEffect(() => {
        if (strategyProject && strategyProject.title && !scriptTopic) {
            // Clean up title (remove "Combo: ", quotes, etc for a cleaner topic)
            const cleanTopic = strategyProject.title.replace("Combo: ", "").replace(/"/g, "").split("+")[0].trim();
            setScriptTopic(cleanTopic.substring(0, 50)); // Keep it short
        }
    }, [strategyProject]);

    const handleAutoAnalyze = async () => {
        if (!strategyProject || analyzingStrategy) return;
        setAnalyzingStrategy(true);
        try {
            // Prepare Wisdom Context
            const highImpactIds = autoIncludeHighImpact ? wisdomTemplates.filter(w => (w.rating || 0) >= 4).map(w => w.id) : [];
            const allSelectedIds = Array.from(new Set([...selectedWisdomIds, ...highImpactIds]));
            const selectedWisdom = wisdomTemplates.filter(w => allSelectedIds.includes(w.id));

            let wisdomContext = "";
            if (selectedWisdom.length > 0) {
                wisdomContext = "\n\n[APPLIED VIRAL WISDOM PRINCIPLES]\n" + selectedWisdom.map(w => {
                    // Handle both old sting content and new object content
                    if (typeof w.content === 'string') return `- ${w.name}: ${w.content}`;
                    if (Array.isArray(w.content)) return w.content.map((n: WisdomNugget) => `- ${n.principle}: ${n.actionableTip}`).join("\n");
                    return "";
                }).join("\n");
            }

            const strategy = await synthesizeStrategyAction(strategyProject.format || "", strategyProject.title + wisdomContext);
            setStrategyContent(strategy);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingStrategy(false);
        }
    };

    const saveStrategy = async () => {
        if (!strategyProject || !strategyContent) return;
        setSavingStrategyStatus("saving");
        await updateProjectAction(strategyProject.id, { format: strategyContent });

        setSavingStrategyStatus("saved");
        setTimeout(() => setSavingStrategyStatus("idle"), 2000);
    };

    const saveAsBlueprint = async () => {
        if (!strategyContent) return;

        // Auto-naming: Project Title + Date
        const baseName = strategyProject ? strategyProject.title : "Master Strategy";
        const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const name = `${baseName} (Bluepr. ${date})`;

        setSavingBlueprintStatus("saving");
        // FIX: saveTemplateAction takes (type, name, content) arguments directly
        await saveTemplateAction(
            "viral-wisdom", // Explicit type for Blueprints
            `🧬 ${name}`,
            strategyContent,
            undefined, // projectId default
            undefined, // tags
            undefined, // rating
            saveCategory // Pass selected category (Growth/Law/Fact)
        );

        setSavingBlueprintStatus("saved");
        await loadTemplates();

        // UPDATE ACTIVE STATE IMMEDIATELY
        setActiveBlueprintName(name.replace("🧬 ", ""));

        setTimeout(() => setSavingBlueprintStatus("idle"), 2000);
    };

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Script State
    const [scriptTopic, setScriptTopic] = useState("");
    const [scriptResult, setScriptResult] = useState<GeneratedScript | null>(null);
    const [scriptLoading, setScriptLoading] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState<"DE" | "EN">("DE");
    const [selectedProtocol, setSelectedProtocol] = useState<string>(""); // Default: no specific protocol

    // Source Selector State
    const [sourceMode, setSourceMode] = useState<"strategy" | "wisdom" | "scratch">("strategy");
    const [selectedWisdomTemplateId, setSelectedWisdomTemplateId] = useState<string>("");

    // Template State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState<"idle" | "saving" | "saved">("idle");

    // Blueprint State
    const [step, setStep] = useState<"blueprint" | "write" | "visualize">("write");
    const [blueprintUrl, setBlueprintUrl] = useState("");
    const [isBlueprintEngineOpen, setIsBlueprintEngineOpen] = useState(false);
    const [blueprintLoading, setBlueprintLoading] = useState(false);
    const [blueprintResult, setBlueprintResult] = useState<string>("");
    const [content, setContent] = useState(""); // For manual editing / blueprint injection
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null); // Track loaded ID

    // Neuro-Scoring State (PEO)
    const [neuroScore, setNeuroScore] = useState<PEOScore | null>(null);
    const [analyzingPEO, setAnalyzingPEO] = useState(false);
    const [pacingData, setPacingData] = useState<PacingDataPoint[] | null>(null);

    const handleAnalyzePEO = async () => {
        // Combine script content for analysis
        let textToAnalyze = "";
        if (scriptResult) {
            textToAnalyze = scriptResult.sections.map(s => s.heading + "\n" + s.content).join("\n\n");
        } else {
            textToAnalyze = content || chatInput; // Fallback to manual content
        }

        if (!textToAnalyze) {
            alert("No content to analyze. Generate a script or write something first.");
            return;
        }

        setAnalyzingPEO(true);
        try {
            const score = await analyzePEOAction(textToAnalyze);
            setNeuroScore(score);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingPEO(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const data = await getTemplatesAction(); // Fetch all types (script, prompt, viral-wisdom)
        setTemplates(data);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;

        const userMsg: ChatMessage = { role: "user", parts: chatInput };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            const history = messages;
            const response = await processChat(history, userMsg.parts);
            const aiMsg: ChatMessage = { role: "model", parts: response };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setChatLoading(false);
        }
    };

    const handleScriptGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptTopic.trim() || scriptLoading) return;

        setScriptLoading(true);
        setScriptResult(null);

        try {
            // DIRECT STRATEGY INJECTION
            let contextToUse: string | undefined = undefined;

            if (sourceMode === "strategy") {
                contextToUse = strategyContent && strategyContent.length > 20 ? strategyContent : undefined;
            } else if (sourceMode === "wisdom") {
                const template = wisdomTemplates.find(t => t.id === selectedWisdomTemplateId);
                if (template) {
                    // Normalize template content to string
                    if (typeof template.content === 'string') {
                        contextToUse = template.content;
                    } else if (Array.isArray(template.content)) {
                        contextToUse = template.content.map((n: any) => `- ${n.principle}: ${n.actionableTip}`).join("\n");
                    }
                }
            }

            const data = await generateScriptAction(
                scriptTopic,
                targetLanguage,
                contextToUse,
                cortexProfile?.perfectLoop,
                cortexProfile?.durationConstraint,
                cortexProfile?.metaNarrative,
                selectedProtocol || undefined // PASS PROTOCOL
            );
            setScriptResult(data);
            if (data) {
                // AUTO-SYNC TO EDITOR CONTENT (For Director Flow)
                const fullText = data.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
                setContent(fullText);

                const pacing = calculatePacingProfile(data);
                setPacingData(pacing);
            }
        } catch (error) {
            console.error("Script Gen Error", error);
        } finally {
            setScriptLoading(false);
        }
    };

    const handleGenesis = async () => {
        if (!scriptTopic.trim()) return;
        setGenesisMode(true);
        setGenesisStatus("SEARCHING");
        setGenesisLogs([]);

        const addLog = (msg: string) => setGenesisLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            // STEP 1: SEARCH OUTLIERS
            addLog(`Scanning YouTube for viral outliers on: "${scriptTopic}"...`);
            const outliers = await searchOutliersAction(scriptTopic);

            if (!outliers || outliers.length === 0) {
                addLog("No outliers found. Aborting Genesis.");
                setGenesisStatus("IDLE");
                return;
            }

            const winner = outliers[0];
            addLog(`WINNER IDENTIFIED: "${winner.title}" (${winner.viewCount} views)`);
            setGenesisStatus("ANALYZING");

            // STEP 2: BLUEPRINT EMULATION
            addLog(`Emulating viral dna from video ID: ${winner.id}...`);
            const blueprint = await generateBlueprintAction(winner.id, scriptTopic, targetLanguage, cortexProfile || undefined);

            // Format Strategy Context from Blueprint
            const strategyContext = `
            EMULATED STRATEGY FROM: ${winner.title}
            HOOK STRATEGY: ${blueprint.adaptation.hook}
            STRUCTURE: ${blueprint.adaptation.structure.join(" -> ")}
            CULTURAL TWIST: ${blueprint.adaptation.germanTwist}
            `;
            setStrategyContent(strategyContext); // Save visualization

            // STEP 3: SCRIPT GENERATION
            setGenesisStatus("WRITING");
            addLog("Synthesizing script with Neuro-Code + Outlier DNA...");
            const script = await generateScriptAction(
                scriptTopic,
                targetLanguage,
                strategyContext,
                cortexProfile?.perfectLoop,
                cortexProfile?.durationConstraint,
                cortexProfile?.metaNarrative,
                selectedProtocol || undefined // PASS PROTOCOL
            );

            if (!script) {
                throw new Error("Script generation failed");
            }

            setScriptResult(script);
            const fullText = script.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
            setContent(fullText);

            // STEP 4: IMAGINING (Prompts)
            setGenesisStatus("IMAGINING");
            addLog("Dreaming up visuals and audio...");

            // Parallel Generation
            const [videoPromptsResRaw, audioPromptsRes, imagePromptsRes] = await Promise.all([
                generateVideoPromptsAction(fullText, 10), // 10 Video Prompts
                generateAudioPromptsAction(fullText),     // 3 Audio Prompts (inside object)
                generateScriptImagePromptsAction(fullText) // 10 Image Prompts (approx)
            ]);

            const videoPromptsRes = videoPromptsResRaw as VideoPrompt[];

            // @ts-ignore
            setVideoPrompts(videoPromptsRes);
            // We don't have a dedicated state for the others yet displayed in this view specifically, 
            // but we will save them implicitly or show them if we add UI.
            // For now, let's just log success.

            addLog(`Generated ${videoPromptsRes?.length || 0} Video Prompts.`);
            addLog(`Generated Audio Concept: ${audioPromptsRes ? "Success" : "Failed"}.`);

            setGenesisStatus("DONE");
            addLog("Genesis Complete. Neuro-Code Link Established.");

        } catch (e) {
            console.error("Genesis Error", e);
            addLog("CRITICAL FAILURE IN GENESIS PROTOCOL.");
            setGenesisStatus("IDLE");
        }
    };

    const handleRefineScript = async () => {
        if (!content || !strategyContent || refiningScript) return;
        setRefiningScript(true);
        try {
            const refined = await refineScriptAction(content, strategyContent, targetLanguage);
            if (refined) {
                setScriptResult(refined);

                // AUTO-SYNC TO EDITOR CONTENT
                const fullText = refined.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
                setContent(fullText);

                const pacing = calculatePacingProfile(refined);
                setPacingData(pacing);
                setStep("visualize"); // Show the result
            }
        } catch (e) {
            console.error(e);
            alert("Refinement failed.");
        } finally {
            setRefiningScript(false);
        }
    };

    const handleExtendScript = async () => {
        if (!content || extendingScript) return;
        setExtendingScript(true);
        try {
            const extended = await extendScriptAction(content, targetLanguage);
            if (extended) {
                setScriptResult(extended);
                const pacing = calculatePacingProfile(extended);
                setPacingData(pacing);
                setStep("visualize");
            }
        } catch (e) {
            console.error(e);
            alert("Extension failed.");
        } finally {
            setExtendingScript(false);
        }
    };

    const handleSaveProject = async () => {
        // Consolidated Saving: Updates the Project Entity with EVERYTHING.
        const textToSave = content || (scriptResult ? scriptResult.sections.map(s => s.content).join('\n') : "");

        if (!strategyProject) {
            alert("No active project. Please create or select a project first.");
            return;
        }

        setSavingTemplate("saving"); // Reuse state for UI feedback

        try {
            await updateProjectAction(strategyProject.id, {
                format: strategyContent, // Save the Strategy
                scriptContent: textToSave, // Save the Script Text
                scriptData: scriptResult || undefined, // Save the JSON Data
                title: strategyProject.title // Ensure title persists
            });

            // Reload to ensure sync
            await loadStrategyProject(strategyProject.id);

            setSavingTemplate("saved");
            setTimeout(() => setSavingTemplate("idle"), 2000);
        } catch (e) {
            console.error("Project Save Failed", e);
            alert("Failed to save project.");
            setSavingTemplate("idle");
        }
    };

    // Legacy/Export Function
    const handleExportBlueprint = async () => {
        if (!strategyContent) return;
        const baseName = strategyProject ? strategyProject.title : "Master Strategy";
        const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const name = `${baseName} (Bluepr. ${date})`;

        await saveTemplateAction(
            "viral-wisdom",
            `🧬 ${name}`,
            strategyContent,
            strategyProject?.id,
            ["Blueprint"],
            5,
            saveCategory
        );
        await loadTemplates();
        alert("Strategy exported as Blueprint to Library.");
    };

    const handleLoadTemplate = (template: Template) => {
        // Robust detection of Blueprints vs Drafts
        const isBlueprint = template.type === "viral-wisdom" || template.name.includes("Blueprint") || template.name.includes("🧬");

        setCurrentTemplateId(template.id); // Track URL/ID

        if (isBlueprint && typeof template.content === 'string') {
            // It's a Strategy Blueprint
            setStrategyContent(template.content);
            setActiveBlueprintName(template.name.replace('🧬 ', '')); // Remove icon for cleaner display
            setActiveTab("script");
        } else if (template.type === "prompt") {
            // Video Prompts
            setVideoPrompts(template.content as VideoPrompt[]);
            setActiveTab("director");
        } else if (template.type === "visual") {
            // Image Prompts
            setImagePrompts(template.content as ScriptImagePrompt[]);
            setActiveTab("visuals");
        } else if (template.type === "audio") {
            // Audio Prompts
            setAudioPrompts(template.content as AudioPrompt);
            setActiveTab("audio");
        } else if (typeof template.content === 'string') {
            // It's a Text Draft (Script)
            setContent(template.content);
            setActiveTab("script"); // Switch to Script tab

            // Try to parse sections for visual sync
            const sectionsRegex = /##\s+(.*?)\n\n([\s\S]*?)(?=\n##|$)/g;
            const sections = [];
            let match;
            while ((match = sectionsRegex.exec(template.content)) !== null) {
                sections.push({
                    heading: match[1].trim(),
                    content: match[2].trim(),
                    visualCue: "",
                    estimatedDuration: "5s"
                });
            }

            setScriptResult({
                title: template.name.replace("Draft: ", ""),
                sections: sections.length > 0 ? sections : []
            });
            setStep("write"); // Focus Editor
        } else {
            // It's a full Script Object (Legacy or strict save)
            setScriptResult(template.content as GeneratedScript);
            if (template.content) {
                const pacing = calculatePacingProfile(template.content as GeneratedScript);
                setPacingData(pacing);
            }
        }
        setShowTemplateManager(false);
    };

    const handleExportDocx = async () => {
        if (!content) return;
        try {
            const blob = await generateDocx(content, scriptResult?.title || "Draft Script");
            const { saveAs } = await import("file-saver");
            saveAs(blob, `${(scriptResult?.title || "script-draft").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed");
        }
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this template?")) {
            await deleteTemplateAction(id);
            await loadTemplates();
        }
    };



    // Oracle State
    const [oracleData, setOracleData] = useState<OraclePrediction | null>(null);
    const [consultingOracle, setConsultingOracle] = useState(false);

    const handleConsultOracle = async () => {
        if (!scriptResult) return;

        let content = scriptResult.sections.map(s => s.content).join("\n\n");
        // Add manual content if exists

        setConsultingOracle(true);
        try {
            const res = await predictPerformanceAction(scriptResult.title, content, "Auto-generated from content");
            setOracleData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setConsultingOracle(false);
        }
    };

    // VAULT SAVING LOGIC
    const [savingToVault, setSavingToVault] = useState(false);

    const handleSaveToVault = async () => {
        if (!scriptResult) return;

        setSavingToVault(true);
        try {
            // Try to load config from localStorage, fallback to empty object (server will use env)
            const configStr = localStorage.getItem("nc_vault_config");
            const config = configStr ? JSON.parse(configStr) : {};

            const content = scriptResult.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n---\n\n");

            // Prepend Title
            const fullContent = `# ${scriptResult.title}\n\n${content}`;

            const res = await saveScriptToVaultAction(config, fullContent, scriptResult.title);
            if (res.success) {
                alert(`Saved to Vault: ${res.key}`);
            } else {
                alert(`Failed: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving to vault.");
        } finally {
            setSavingToVault(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <PencilRuler className="w-8 h-8 text-primary" />
                        Script Forge <span className="text-xs align-top font-mono border border-red-500/30 bg-red-500/10 rounded px-1 ml-1 text-red-500">automated</span>
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Draft, structure, and refine your content.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <SnapshotButton
                            targetId="architect-workspace"
                            title={scriptResult?.title || strategyProject?.title || "Architect Screenshot"}
                        />
                    </div>

                    {/* Language Selector */}
                    <div className="bg-muted/20 p-1 rounded-lg flex items-center gap-1 border border-border/30">
                        <button
                            onClick={() => setTargetLanguage("DE")}
                            className={cn("px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5", targetLanguage === "DE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            <span className="text-sm">🇩🇪</span> DE
                        </button>
                        <button
                            onClick={() => setTargetLanguage("EN")}
                            className={cn("px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5", targetLanguage === "EN" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            <span className="text-sm">🇺🇸</span> EN
                        </button>
                    </div>

                    <div className="bg-muted/20 p-1 rounded-lg flex items-center gap-2">
                        {true && (
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Core Workflow */}
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setActiveTab("strategy")} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group", activeTab === "strategy" ? "bg-purple-500/10 text-purple-500" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                        <BrainCircuit className="w-4 h-4" /> <span className="hidden sm:inline">Strategy</span>
                                    </button>
                                    <button onClick={() => setActiveTab("script")} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group", activeTab === "script" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                        <PencilRuler className="w-4 h-4" /> <span className="hidden sm:inline">Builder</span>
                                    </button>
                                </div>

                                <div className="w-px h-6 bg-border/50 mx-1" />

                                {/* Production Phase */}
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setActiveTab("visuals")} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group", activeTab === "visuals" ? "bg-pink-500/10 text-pink-500" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                        <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Visuals</span>
                                    </button>

                                    <button onClick={() => setActiveTab("audio")} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group", activeTab === "audio" ? "bg-blue-500/10 text-blue-500" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                        <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Sonic</span>
                                    </button>

                                    <button onClick={() => setActiveTab("director")} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group", activeTab === "director" ? "bg-amber-500/10 text-amber-500" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                        <Clapperboard className="w-4 h-4" /> <span className="hidden sm:inline">Director</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- WORKSPACE CONTENT --- */}
            {/* We wrap this entire section for Snapshot purposes */}
            <div id="architect-workspace" className="flex-1 overflow-hidden relative flex flex-col min-h-0">

                {/* --- STRATEGY FORGE MODE --- */}
                {activeTab === "strategy" && (
                    <div className="h-full grid grid-cols-12 gap-6 overflow-hidden">
                        {/* LEFT: Context / Fusion Inputs */}
                        <div className="col-span-4 bg-card/50 border border-purple-500/20 rounded-xl p-6 overflow-y-auto">
                            <div className="flex items-center gap-2 text-purple-400 mb-4">
                                <Zap className="w-5 h-5" />
                                <h3 className="font-bold">Fusion Inputs</h3>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <h4 className="text-foreground">{strategyProject?.title || "New Strategy Scope"}</h4>
                                <div className="whitespace-pre-wrap text-muted-foreground mt-4 p-4 bg-background/50 rounded-lg border border-border/50 font-mono text-xs">
                                    {strategyProject ?
                                        (strategyProject.status === "draft" ?
                                            (strategyProject.title.includes("Combo") ? strategyProject.title : "No specific combo data.")
                                            : "Project Description...")
                                        : "No active project. Use the Builder or Scanner to start, or paste a Strategy below."}
                                    {strategyProject && strategyContent === "" && strategyProject.format && strategyProject.format !== strategyContent ? strategyProject.format : ""}
                                </div>
                                { /* We need to display the original 'description' (which was passed as 'format' during creation technically?? No, wait. createProjectAction takes (title, format). In scanner we passed description as the second arg! So it's stored in 'format' field of project. */}
                                {strategyContent === "" && strategyProject?.format && strategyProject.format !== strategyContent ? strategyProject.format : ""}
                                { /* Wait, we loaded format into strategyContent. Let's show the original read-only if we want context, or just pre-fill. */}
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                Analyze the inputs above and synthesize your Master Strategy on the right.
                            </p>
                            <button
                                onClick={handleAutoAnalyze}
                                disabled={analyzingStrategy}
                                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                            >
                                {analyzingStrategy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {analyzingStrategy ? "Synthesizing Strategy..." : "Auto-Synthesize Strategy"}
                            </button>


                            {/* Wisdom Selection (New Feature) */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-sm text-yellow-500 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> Apply Viral Wisdom
                                    </h4>
                                    <button
                                        onClick={() => setAutoIncludeHighImpact(!autoIncludeHighImpact)}
                                        className={cn("text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1",
                                            autoIncludeHighImpact ? "bg-yellow-500/20 text-yellow-200 border-yellow-500/50" : "bg-transparent text-muted-foreground border-white/10 hover:bg-muted/30"
                                        )}
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Auto-Include ★4+
                                    </button>
                                </div>
                                <div className="bg-background/50 rounded-lg p-2 max-h-48 overflow-y-auto space-y-2 border border-border/50">
                                    {(!wisdomTemplates || wisdomTemplates.length === 0) ? (
                                        <p className="text-xs text-muted-foreground p-2">No learned wisdom yet. Visit the Scanner.</p>
                                    ) : (
                                        wisdomTemplates?.map((w: Template) => {
                                            const isSelected = selectedWisdomIds.includes(w.id);
                                            return (
                                                <button
                                                    key={w.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedWisdomIds(prev => prev.filter(id => id !== w.id));
                                                        } else {
                                                            setSelectedWisdomIds(prev => [...prev, w.id]);
                                                        }
                                                    }}
                                                    className={cn("w-full text-left p-2 rounded hover:bg-muted/50 text-xs transition-colors flex items-center gap-2", isSelected ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-200" : "text-muted-foreground")}
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-yellow-500" : "bg-muted-foreground/30")} />
                                                    <span className="truncate flex-1">{w.name.replace("Wisdom: ", "")}</span>
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT: Strategy Pad (Editor) */}
                        <div className="col-span-8 flex flex-col bg-background border border-purple-500/30 rounded-xl shadow-lg overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-border/40 bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    <span className="font-bold text-sm">Strategy Pad</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExportBlueprint}
                                        disabled={savingBlueprintStatus === "saving"}
                                        className={cn("bg-secondary/50 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 border border-border/50",
                                            savingBlueprintStatus === "saved" && "bg-green-500/20 text-green-500 border-green-500/20"
                                        )}
                                    >
                                        {savingBlueprintStatus === "saving" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                            savingBlueprintStatus === "saved" ? <CheckCircle2 className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
                                        {savingBlueprintStatus === "saved" ? "Exported!" : "Export Blueprint"}
                                    </button>

                                    {/* Category Selector for Blueprint */}
                                    <select
                                        value={saveCategory}
                                        onChange={e => setSaveCategory(e.target.value as any)}
                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <option value="GROWTH">Creator Growth</option>
                                        <option value="LAW">Immut. Law</option>
                                        <option value="FACT">Sci. Fact</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveProject}
                                            disabled={savingTemplate === "saving"}
                                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg",
                                                savingTemplate === "saved" ? "bg-green-500 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                            )}
                                        >
                                            {savingTemplate === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                savingTemplate === "saved" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {savingTemplate === "saved" ? "Project Saved" : "Save Project"}
                                        </button>

                                        <button
                                            onClick={() => setShowTemplateManager(true)}
                                            className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-white/10"
                                            title="Load Template Library"
                                        >
                                            <FolderOpen className="w-4 h-4 text-primary" /> Load Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <textarea
                                value={strategyContent}
                                onChange={(e) => setStrategyContent(e.target.value)}
                                className="flex-1 w-full bg-transparent p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                                placeholder="# My Master Strategy\n\n1. Hook Structure: ...\n2. Visual Style: ...\n3. Pacing: ..."
                            />
                        </div>
                    </div>
                )
                }

                {/* --- SCRIPT BUILDER INTERFACE --- */}
                {
                    activeTab === "script" && (
                        <div className="flex-1 overflow-y-auto space-y-6 relative">
                            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg flex items-start gap-4">
                                <form onSubmit={handleScriptGenerate} className="flex-1 flex gap-4 items-center">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={scriptTopic}
                                            onChange={(e) => setScriptTopic(e.target.value)}
                                            placeholder="Enter script topic (e.g. Protocol for Deep Sleep)..."
                                            className="w-full bg-muted/30 border border-border/40 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />

                                        {/* Source Selection Logic */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-2 bg-muted/20 px-2 py-1 rounded border border-white/5">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Source:</span>
                                                <select
                                                    value={sourceMode}
                                                    onChange={e => setSourceMode(e.target.value as any)}
                                                    className="bg-transparent text-xs focus:outline-none text-foreground font-medium"
                                                >
                                                    <option value="strategy">Strategy Project (Trendjack)</option>
                                                    <option value="wisdom">Viral Wisdom Pattern</option>
                                                    <option value="scratch">Manual / Scratch</option>
                                                </select>
                                            </div>

                                            {sourceMode === "wisdom" && (
                                                <select
                                                    value={selectedWisdomTemplateId}
                                                    onChange={e => setSelectedWisdomTemplateId(e.target.value)}
                                                    className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded px-2 py-1 text-xs focus:outline-none max-w-[200px]"
                                                >
                                                    <option value="">Select Pattern...</option>
                                                    {wisdomTemplates?.map((t: Template) => <option key={t.id} value={t.id}>{t.name?.replace("Wisdom: ", "") || "Untitled"}</option>)}
                                                </select>
                                            )}

                                            {sourceMode === "strategy" && strategyContent && (
                                                <div className="flex items-center gap-2 text-xs text-purple-400 font-mono bg-purple-900/10 px-2 py-1 rounded border border-purple-500/20">
                                                    <Brain className="w-3 h-3" />
                                                    <span className="truncate max-w-[200px]">Connected: <span className="font-bold text-purple-300">{activeBlueprintName || "Project Strategy"}</span></span>
                                                </div>
                                            )}
                                            {sourceMode === "strategy" && !strategyContent && (
                                                <div className="flex items-center gap-2 text-xs text-yellow-500 font-mono bg-yellow-900/10 px-2 py-1 rounded border border-yellow-500/20">
                                                    <Brain className="w-3 h-3" />
                                                    <span>No Strategy Found</span>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Protocol Selection */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Structure:</span>
                                            <select
                                                value={selectedProtocol}
                                                onChange={e => setSelectedProtocol(e.target.value)}
                                                className="bg-transparent text-xs focus:outline-none text-blue-200 font-medium min-w-[150px]"
                                            >
                                                <option value="" className="text-black">Standard (Smart)</option>
                                                {VIRAL_PROTOCOLS.map(p => (
                                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Genesis Toggle */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setGenesisMode(!genesisMode)}
                                            className={cn("text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border transition-colors",
                                                genesisMode ? "bg-red-500/20 text-red-500 border-red-500/50" : "bg-muted text-muted-foreground border-transparent hover:border-border"
                                            )}
                                        >
                                            {genesisMode ? "🔴 GENESIS PROTOCOL: ARMED" : "⚪ AUTO-PILOT: OFF"}
                                        </button>
                                    </div>
                                    <button
                                        type={genesisMode ? "button" : "submit"}
                                        onClick={genesisMode ? handleGenesis : undefined}
                                        disabled={scriptLoading || !scriptTopic || (genesisMode && genesisStatus !== "IDLE" && genesisStatus !== "DONE")}
                                        className={cn("bg-primary text-background font-bold px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 min-w-[140px] justify-center h-[52px]",
                                            genesisMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-primary text-background hover:bg-primary/90"
                                        )}
                                    >
                                        {scriptLoading || (genesisMode && genesisStatus !== "IDLE" && genesisStatus !== "DONE") ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                            genesisMode ? <Zap className="w-5 h-5" /> : <PencilRuler className="w-5 h-5" />}
                                        {genesisMode ? (genesisStatus === "IDLE" || genesisStatus === "DONE" ? "IGNITE GENESIS" : genesisStatus) : "Architect"}
                                    </button>
                                </form>
                            </div>

                            {/* GENESIS LOGS */}
                            {
                                genesisMode && genesisLogs.length > 0 && (
                                    <div className="bg-black/50 font-mono text-xs p-4 rounded-xl border border-red-500/30 text-red-300 space-y-1 max-h-[200px] overflow-y-auto">
                                        <h4 className="font-bold border-b border-red-500/30 pb-2 mb-2 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> NEURAL LINK ACTIVITY
                                        </h4>
                                        {genesisLogs.map((log, i) => (
                                            <div key={i} className="opacity-80">{log}</div>
                                        ))}
                                    </div>
                                )
                            }

                            {/* BLUEPRINT ENGINE */}
                            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 transition-all">
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBlueprintEngineOpen(!isBlueprintEngineOpen)}>
                                    <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                                        <BrainCircuit className="w-5 h-5" /> Blueprint Engine (Viral Reverser)
                                    </h3>
                                    <button className="text-xs uppercase tracking-widest text-blue-500 hover:text-blue-300">
                                        {isBlueprintEngineOpen ? "Hide" : "Expand"}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isBlueprintEngineOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 space-y-4">
                                                <p className="text-xs text-muted-foreground">
                                                    Paste a YouTube URL to deconstruct its viral DNA and adapt it for Neuro-Code.
                                                </p>
                                                <div className="flex gap-2">
                                                    <input
                                                        placeholder="Paste Viral Source URL (YouTube)..."
                                                        className="flex-1 bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-white"
                                                        id="blueprint-url"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            const url = (document.getElementById('blueprint-url') as HTMLInputElement).value;
                                                            const videoId = url.split("v=")[1]?.substring(0, 11);
                                                            if (!videoId) return alert("Invalid URL");

                                                            try {
                                                                // Quick spinner or loading state here in a real app
                                                                const res = await generateBlueprintAction(videoId, "Neuroscience / Productivity");
                                                                // Inject into editor mostly, but for now just show result
                                                                const blueprintText = `
# 🧬 VIRAL BLUEPRINT

## 🇺🇸 ORIGINAL (The Container)
**HOOK:** ${res.original.hook}
**TWIST:** ${res.original.twist}
**GENIUS ELEMENTS:**
${res.original.geniusElements.map(e => `- ${e}`).join('\n')}

---

## 🇩🇪 ADAPTATION (Neuro-Code)
**HOOK:** ${res.adaptation.hook}
**CULTURAL ADJUSTMENTS:** ${res.adaptation.culturalAdjustments}
**DIFFERENTIATION:**
${res.adaptation.differentiation.map(e => `- ${e}`).join('\n')}
`;
                                                                setStrategyContent(blueprintText);
                                                                setActiveTab("strategy");
                                                                setIsBlueprintEngineOpen(false);
                                                                alert("Blueprint extracted! Review it in the Strategy Pad.");
                                                            } catch (e: any) {
                                                                console.error(e);
                                                                alert("Analysis Failed: " + e.message);
                                                            }
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold"
                                                    >
                                                        Analyze
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                            {
                                scriptResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card/50 border border-border/40 rounded-xl p-8 space-y-8 relative"
                                    >
                                        {neuroScore && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <NeuroScore score={neuroScore} />
                                            </motion.div>
                                        )}

                                        {pacingData && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <RetentionGraph data={pacingData} />
                                            </motion.div>
                                        )}

                                        {oracleData && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <OracleCard data={oracleData} />
                                            </motion.div>
                                        )}

                                        <div className="absolute top-8 right-8 flex gap-2">
                                            <button
                                                onClick={handleConsultOracle}
                                                disabled={consultingOracle}
                                                className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm"
                                            >
                                                {consultingOracle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                                <span className="text-sm font-bold">Consult Oracle</span>
                                            </button>
                                            <button
                                                onClick={handleSaveToVault}
                                                disabled={savingToVault}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm"
                                                title="Save markdown to Cloud Vault"
                                            >
                                                {savingToVault ? <Loader2 className="w-5 h-5 animate-spin" /> : <img src="/icons/cloud-upload.svg" className="w-5 h-5" onError={(e) => e.currentTarget.style.display = 'none'} alt="" />}
                                                {/* Fallback icon if image fails, or just use Lucid icon */}
                                                {!savingToVault && <Cloud className="w-5 h-5" />}
                                                <span className="text-sm font-bold">Save to Cloud</span>
                                            </button>


                                        </div>

                                        <div className="text-center border-b border-border/40 pb-6">
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Script Draft</span>
                                            <h1 className="text-3xl font-bold mt-2">{scriptResult.title}</h1>
                                        </div>

                                        <div className="grid md:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                                            {/* LEFT: Editor (Sticky) */}
                                            <div className="md:col-span-5 h-full flex flex-col">
                                                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-lg h-full flex flex-col">
                                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
                                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                                            <Binary className="w-5 h-5 text-primary" />
                                                            Script Architect
                                                        </h2>

                                                        {/* Tools */}
                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                            <button
                                                                onClick={() => setShowTemplateManager(true)}
                                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border border-white/10 bg-muted/50 hover:bg-muted text-foreground transition-colors"
                                                                title="Load Template"
                                                            >
                                                                <FolderOpen className="w-3 h-3" /> Load
                                                            </button>
                                                            <button
                                                                onClick={handleSaveProject}
                                                                disabled={savingTemplate === "saving"}
                                                                title="Save Project"
                                                                className={cn("flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border transition-colors",
                                                                    savingTemplate === "saved" ? "border-green-500/30 text-green-500 bg-green-500/10" : "border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                                                )}
                                                            >
                                                                {savingTemplate === "saving" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                                    savingTemplate === "saved" ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                                                                {savingTemplate === "saved" ? "Saved" : "Save"}
                                                            </button>
                                                            <button
                                                                onClick={handleExportDocx}
                                                                disabled={!content}
                                                                title="Export as Word DOCX"
                                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors"
                                                            >
                                                                <FileDown className="w-3 h-3" /> DOCX
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const draftText = scriptResult.sections.map(s => `## ${s.heading}\n\n${s.content}`).join("\n\n");
                                                                    setContent(draftText);
                                                                    setStep("write");
                                                                }}
                                                                title="Import AI Draft to Editor"
                                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors"
                                                            >
                                                                <Layout className="w-3 h-3" /> Import
                                                            </button>
                                                            {strategyContent && (
                                                                <button
                                                                    onClick={handleRefineScript}
                                                                    disabled={refiningScript || !content}
                                                                    title="Refine Draft using Viral Strategy Blueprint"
                                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                                >
                                                                    {refiningScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                    Refine
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={handleExtendScript}
                                                                disabled={extendingScript || !content}
                                                                title="Extend Script Length & Depth (approx +50%)"
                                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                                                            >
                                                                {extendingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
                                                                Extend
                                                            </button>
                                                            <div className="flex bg-muted/20 rounded p-1">
                                                                <button
                                                                    onClick={() => setStep("blueprint")}
                                                                    className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-all ${step === "blueprint" ? "bg-blue-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                                                                >
                                                                    Blueprint
                                                                </button>
                                                                <button
                                                                    onClick={() => setStep("write")}
                                                                    className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-all ${step === "write" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                                                >
                                                                    Editor
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 bg-muted/10 rounded-lg p-4 font-mono text-sm leading-relaxed overflow-y-auto outline-none focus:ring-2 focus:ring-primary/50 relative">
                                                        {step === "blueprint" ? (
                                                            <div className="space-y-6">
                                                                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                                                                    <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                                                        <Bot className="w-4 h-4" /> Blueprint Engine (Reverse Engineering)
                                                                    </h3>
                                                                    <p className="text-xs text-muted-foreground mb-4">
                                                                        Paste a YouTube URL to deconstruct its viral DNA and adapt it for Neuro-Code.
                                                                    </p>
                                                                </div>
                                                                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                                                                    <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                                                        <Bot className="w-4 h-4" /> Blueprint Mode
                                                                    </h3>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Use the <strong>"Viral Reverser"</strong> panel above to analyze a YouTube video.
                                                                        The results will appear here automatically.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={content}
                                                                onChange={(e) => setContent(e.target.value)}
                                                                className="w-full h-full bg-transparent resize-none outline-none"
                                                                placeholder="// Start writing your script here or click 'IMPORT DRAFT' to use the AI suggestions..."
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: AI Suggestions (Scrollable) */}
                                            <div className="md:col-span-7 space-y-6 overflow-y-auto pr-2 pb-20">
                                                {scriptResult.sections.map((section, idx) => (
                                                    <div key={idx} className="bg-muted/5 border border-border/20 rounded-xl p-6 relative group hover:border-primary/20 transition-colors">
                                                        <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary/20 rounded-r group-hover:bg-primary transition-colors" />

                                                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-3 pl-4">
                                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center border border-primary/20 font-mono">
                                                                {idx + 1}
                                                            </span>
                                                            {section.heading}
                                                        </h3>
                                                        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4 text-sm">
                                                            {section.content}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            }
                        </div >
                    )
                }


                {
                    activeTab === "visuals" && (
                        <div className="flex-1 bg-card/50 border border-border/40 rounded-xl p-6 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-pink-500">
                                        <Eye className="w-6 h-6" /> Image Forge
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Generate Midjourney & DALL-E prompts for your script scenes.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!content && (
                                        <button
                                            onClick={() => setShowTemplateManager(true)}
                                            className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-muted/80 transition-colors border border-dashed border-border"
                                        >
                                            <FolderOpen className="w-4 h-4" /> Load Script
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (!content || generatingImages) return;
                                            setGeneratingImages(true);
                                            try {
                                                const prompts = await generateScriptImagePromptsAction(content);
                                                setImagePrompts(prompts);
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setGeneratingImages(false);
                                            }
                                        }}
                                        disabled={generatingImages || !content}
                                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {generatingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {generatingImages ? "Forging..." : "Generate Visuals"}
                                    </button>

                                    {imagePrompts && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    const blob = await generateImagePromptsDocx(imagePrompts, `Visuals - ${scriptResult?.title || "Untitled"}`);
                                                    const { saveAs } = await import("file-saver");
                                                    saveAs(blob, `Visuals - ${scriptResult?.title || "Untitled"}.docx`);
                                                }}
                                                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <FileDown className="w-4 h-4" /> DOCX
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (savingImages === "saving") return;
                                                    setSavingImages("saving");
                                                    try {
                                                        await saveTemplateAction("visual", `🖼️ Visuals: ${scriptResult?.title || "Untitled"}`, imagePrompts);
                                                        await loadTemplates();
                                                        setSavingImages("saved");
                                                        setTimeout(() => setSavingImages("idle"), 2000);
                                                    } catch (e) {
                                                        console.error("Save failed", e);
                                                        setSavingImages("idle");
                                                    }
                                                }}
                                                disabled={savingImages === "saving"}
                                                className={cn("px-4 py-2 rounded-lg font-bold flex items-center gap-2 border transition-colors",
                                                    savingImages === "saved" ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-muted border-border hover:bg-muted/80"
                                                )}
                                            >
                                                {savingImages === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                    savingImages === "saved" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                                {savingImages === "saved" ? "Saved" : "Save"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {!imagePrompts ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 border-2 border-dashed border-border/30 rounded-xl">
                                        <Eye className="w-16 h-16 mb-4" />
                                        <p>No visuals forged yet. Click "Generate" to start.</p>
                                    </div>
                                ) : (
                                    imagePrompts.map((item, idx) => (
                                        <div key={idx} className="bg-background border border-border/50 rounded-xl p-4 shadow-sm hover:border-pink-500/30 transition-colors">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-pink-500/10 text-pink-500 text-xs font-bold px-2 py-1 rounded">ISO {idx + 1}</span>
                                                <span className="font-bold text-sm">{item.segmentContext}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-muted/10 p-3 rounded-lg border border-border/30">
                                                    <div className="text-xs font-bold text-purple-400 mb-2">Midjourney v6</div>
                                                    <p className="text-xs font-mono text-muted-foreground">{item.midjourney}</p>
                                                </div>
                                                <div className="bg-muted/10 p-3 rounded-lg border border-border/30">
                                                    <div className="text-xs font-bold text-green-400 mb-2">DALL-E 3</div>
                                                    <p className="text-xs font-mono text-muted-foreground">{item.dalle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }

                {/* --- AUDIO TAB (SONIC LAB) --- */}
                {
                    activeTab === "audio" && (
                        <div className="flex-1 bg-card/50 border border-border/40 rounded-xl p-6 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-500">
                                        <Activity className="w-6 h-6" /> Sonic Lab
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Design the Audio Strategy (Suno/Udio) & Voiceover Direction.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!content && (
                                        <button
                                            onClick={() => setShowTemplateManager(true)}
                                            className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-muted/80 transition-colors border border-dashed border-border"
                                        >
                                            <FolderOpen className="w-4 h-4" /> Load Script
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (!content || generatingAudio) return;
                                            setGeneratingAudio(true);
                                            try {
                                                const result = await generateAudioPromptsAction(content);
                                                setAudioPrompts(result);
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setGeneratingAudio(false);
                                            }
                                        }}
                                        disabled={generatingAudio || !content}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {generatingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {generatingAudio ? "Synthesizing..." : "Generate Audio Strategy"}
                                    </button>

                                    {audioPrompts && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    const blob = await generateAudioPromptsDocx(audioPrompts, `Audio - ${scriptResult?.title || "Untitled"}`);
                                                    const { saveAs } = await import("file-saver");
                                                    saveAs(blob, `Audio - ${scriptResult?.title || "Untitled"}.docx`);
                                                }}
                                                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <FileDown className="w-4 h-4" /> DOCX
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (savingAudio === "saving") return;
                                                    setSavingAudio("saving");
                                                    try {
                                                        await saveTemplateAction("audio", `🎵 Audio: ${scriptResult?.title || "Untitled"}`, audioPrompts);
                                                        await loadTemplates();
                                                        setSavingAudio("saved");
                                                        setTimeout(() => setSavingAudio("idle"), 2000);
                                                    } catch (e) {
                                                        console.error("Save failed", e);
                                                        setSavingAudio("idle");
                                                    }
                                                }}
                                                disabled={savingAudio === "saving"}
                                                className={cn("px-4 py-2 rounded-lg font-bold flex items-center gap-2 border transition-colors",
                                                    savingAudio === "saved" ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-muted border-border hover:bg-muted/80"
                                                )}
                                            >
                                                {savingAudio === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                    savingAudio === "saved" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                                {savingAudio === "saved" ? "Saved" : "Save"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                                {!audioPrompts ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 border-2 border-dashed border-border/30 rounded-xl">
                                        <Activity className="w-16 h-16 mb-4" />
                                        <p>No audio strategy yet. Click "Generate" to start.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm">
                                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-yellow-500" /> Global Mood
                                            </h3>
                                            <p className="text-lg text-muted-foreground italic">"{audioPrompts.mood}"</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm border-l-4 border-l-purple-500">
                                                <h3 className="text-sm font-bold text-purple-500 mb-3 uppercase tracking-wider">Suno AI Prompt</h3>
                                                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{audioPrompts.suno}</p>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(audioPrompts.suno)}
                                                    className="mt-4 text-xs font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy Prompt
                                                </button>
                                            </div>

                                            <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm border-l-4 border-l-indigo-500">
                                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Udio Prompt</h3>
                                                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{audioPrompts.udio}</p>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(audioPrompts.udio)}
                                                    className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy Prompt
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm border-l-4 border-l-red-500">
                                            <h3 className="text-sm font-bold text-red-500 mb-3 uppercase tracking-wider">Voiceover Direction (ElevenLabs)</h3>
                                            <p className="font-mono text-sm text-muted-foreground leading-relaxed">{audioPrompts.voiceover}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }


                {
                    activeTab === "director" && (
                        <div className="flex-1 bg-card/50 border border-border/40 rounded-xl p-6 overflow-hidden flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-500">
                                        <Clapperboard className="w-6 h-6" /> Video Director Mode
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Transform your script into actionable AI Video Prompts (Meta Movie Gen / Runway).
                                    </p>
                                </div>

                                {!content && (
                                    <button
                                        onClick={() => setShowTemplateManager(true)}
                                        className="bg-muted text-muted-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-muted/80 transition-colors border border-dashed border-border"
                                    >
                                        <FolderOpen className="w-4 h-4" /> Load Script Source
                                    </button>
                                )}

                                {content && (
                                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded border border-border/30 text-xs">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span className="opacity-70">Source:</span>
                                        <span className="font-bold truncate max-w-[200px]">{scriptResult?.title || content.substring(0, 30) + "..."}</span>
                                    </div>
                                )}

                                <button
                                    onClick={async () => {
                                        if (!content || generatingPrompts) return;
                                        setGeneratingPrompts(true);
                                        try {
                                            const prompts = await generateVideoPromptsAction(content);
                                            setVideoPrompts(prompts);
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to generate prompts");
                                        } finally {
                                            setGeneratingPrompts(false);
                                        }
                                    }}
                                    disabled={generatingPrompts || !content}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {generatingPrompts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {generatingPrompts ? "Directing..." : "Generate Scene Prompts"}
                                </button>

                                {videoPrompts && (
                                    <>
                                        <button
                                            onClick={async () => {
                                                if (savingPrompts === "saving") return;
                                                setSavingPrompts("saving");
                                                try {
                                                    const name = `🎬 Prompts: ${scriptResult?.title || "Untitled"}`;
                                                    await saveTemplateAction("prompt", name, videoPrompts);
                                                    // Removed loadTemplates() to prevent scroll jump
                                                    setSavingPrompts("saved");
                                                    setTimeout(() => setSavingPrompts("idle"), 2000);
                                                } catch (e) {
                                                    console.error(e);
                                                    setSavingPrompts("idle");
                                                }
                                            }}
                                            disabled={savingPrompts === "saving"}
                                            className={cn("px-4 py-2 rounded-lg font-bold flex items-center gap-2 border transition-colors",
                                                savingPrompts === "saved" ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-muted border-border hover:bg-muted/80"
                                            )}
                                        >
                                            {savingPrompts === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                savingPrompts === "saved" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {savingPrompts === "saved" ? "Saved" : "Save Prompts"}
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const blob = await generatePromptsDocx(videoPrompts, `Prompts - ${scriptResult?.title || "Untitled"}`);
                                                const { saveAs } = await import("file-saver");
                                                saveAs(blob, `Prompts - ${scriptResult?.title || "Untitled"}.docx`);
                                            }}
                                            className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                        >
                                            <FileDown className="w-4 h-4" /> DOCX
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {!videoPrompts ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 border-2 border-dashed border-border/30 rounded-xl">
                                        <Clapperboard className="w-16 h-16 mb-4" />
                                        <p>No scenes directed yet. Click "Generate" to start.</p>
                                    </div>
                                ) : (
                                    videoPrompts.map((scene) => (
                                        <div key={scene.sceneId} className="bg-background border border-border/50 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded">
                                                        SCENE {scene.sceneId}
                                                    </span>
                                                    <span className="text-sm font-bold text-foreground">
                                                        {scene.focus}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                                                    {scene.visualFocus}
                                                </span>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground italic border-l-2 border-border">
                                                    "{scene.voiceoverSegment}"
                                                </div>
                                                <div className="relative group">
                                                    <div className="bg-black/80 text-green-400 p-3 rounded-lg text-sm font-mono border border-green-900/30">
                                                        {scene.prompt}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(scene.prompt);
                                                            setCopiedPromptId(scene.sceneId);
                                                            setTimeout(() => setCopiedPromptId(null), 2000);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-background/80 text-foreground rounded hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Copy Prompt"
                                                    >
                                                        {copiedPromptId === scene.sceneId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }


                {
                    activeTab === "chat" && (
                        <>
                            <div
                                ref={scrollRef}
                                className="flex-1 bg-card/50 border border-border/40 rounded-t-xl overflow-y-auto p-6 space-y-6 scroll-smooth"
                            >
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                        <MessageSquare className="w-16 h-16 mb-4" />
                                        <p>Initialize Neural Link to begin...</p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex w-full",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-primary/20 text-foreground rounded-br-none border border-primary/20"
                                                    : "bg-muted/50 text-foreground/90 rounded-bl-none border border-border/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-2 opacity-70">
                                                {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                <span className="text-xs uppercase font-bold tracking-wider">
                                                    {msg.role === "user" ? "Operator" : "System"}
                                                </span>
                                            </div>
                                            <div className="whitespace-pre-wrap">{msg.parts}</div>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted/20 px-4 py-3 rounded-2xl rounded-bl-none border border-border/10 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-background border border-t-0 border-border/40 rounded-b-xl p-4">
                                <form onSubmit={handleChatSubmit} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type your query..."
                                        disabled={chatLoading}
                                        className="flex-1 bg-muted/30 border border-border/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-muted-foreground text-foreground"
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="bg-secondary text-secondary-foreground font-bold p-3 rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )
                }
                {/* Global Template Manager (Always Rendered) */}
                <TemplateManager
                    isOpen={showTemplateManager}
                    onClose={() => setShowTemplateManager(false)}
                    templates={templates}
                    onLoad={handleLoadTemplate}
                    onRefresh={loadTemplates}
                />
            </div >
            {/* End of Workspace Wrapper */}
        </div >
    );
}
// Ensure handleLoadTemplate can handle prompt loading
// It currently setsContent, but for prompts we might want to populate videoPrompts state?
