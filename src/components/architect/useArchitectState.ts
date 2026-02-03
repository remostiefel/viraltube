import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Project } from "@/lib/projects";
import { StrategyProfile, ChatMessage } from "@/lib/gemini";
import { GeneratedScript, WisdomNugget, PEOScore, VideoPrompt, ScriptImagePrompt, AudioPrompt } from "@/lib/openai";
import { Template } from "@/lib/templates";
import { PacingDataPoint, calculatePacingProfile } from "@/lib/pacing";
import { OraclePrediction } from "@/lib/oracle";
import {
    getProjectByIdAction,
    getTemplatesAction,
    updateProjectAction,
    saveTemplateAction,
    deleteTemplateAction,
    saveScriptToVaultAction,
    predictPerformanceAction,
    analyzePEOAction
} from "@/app/actions";

export function useArchitectState() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("project");
    const templateId = searchParams.get("templateId");

    // --- Strategy State ---
    const [strategyProject, setStrategyProject] = useState<Project | null>(null);
    const [strategyContent, setStrategyContent] = useState("");
    const [isStrategiesMode, setIsStrategiesMode] = useState(false);
    const [analyzingStrategy, setAnalyzingStrategy] = useState(false);
    const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);

    // --- Script State (Builder) ---
    const [content, setContent] = useState("");
    const [scriptTopic, setScriptTopic] = useState("");
    const [scientificEvidence, setScientificEvidence] = useState(""); // Phase 5.5
    const [thumbnailConcept, setThumbnailConcept] = useState("");
    const [scriptResult, setScriptResult] = useState<GeneratedScript | null>(null);
    const [scriptLoading, setScriptLoading] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState<"DE" | "EN">("DE");
    const [selectedProtocol, setSelectedProtocol] = useState<string>("");

    // --- UI/Tab State ---
    const [activeTab, setActiveTab] = useState<"chat" | "script" | "strategy" | "director" | "visuals" | "audio">("strategy");
    const [activeBlueprintName, setActiveBlueprintName] = useState<string | null>(null);
    const [step, setStep] = useState<"blueprint" | "write" | "visualize">("write");
    const [isBlueprintEngineOpen, setIsBlueprintEngineOpen] = useState(false);


    // --- Processing Status State ---
    const [refiningScript, setRefiningScript] = useState(false);
    const [extendingScript, setExtendingScript] = useState(false);
    const [condensingScript, setCondensingScript] = useState(false);
    const [savingStrategyStatus, setSavingStrategyStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [savingBlueprintStatus, setSavingBlueprintStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [saveCategory, setSaveCategory] = useState<"LAW" | "FACT" | "GROWTH">("GROWTH");

    // --- Assets State ---
    const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[] | null>(null);
    const [imagePrompts, setImagePrompts] = useState<ScriptImagePrompt[] | null>(null);
    const [audioPrompts, setAudioPrompts] = useState<AudioPrompt | null>(null);
    const [generatingImages, setGeneratingImages] = useState(false);
    const [savingImages, setSavingImages] = useState<"idle" | "saving" | "saved">("idle");
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [savingAudio, setSavingAudio] = useState<"idle" | "saving" | "saved">("idle");
    const [generatingPrompts, setGeneratingPrompts] = useState(false);
    const [savingPrompts, setSavingPrompts] = useState<"idle" | "saving" | "saved">("idle");
    const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

    // --- Genesis State ---
    const [genesisMode, setGenesisMode] = useState(false);
    const [genesisStatus, setGenesisStatus] = useState<"IDLE" | "SEARCHING" | "ANALYZING" | "WRITING" | "IMAGINING" | "DONE">("IDLE");
    const [genesisLogs, setGenesisLogs] = useState<string[]>([]);

    // --- Chat State ---
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // --- Wisdom/Templates State ---
    const [wisdomTemplates, setWisdomTemplates] = useState<Template[]>([]);
    const [selectedWisdomIds, setSelectedWisdomIds] = useState<string[]>([]);
    const [autoIncludeHighImpact, setAutoIncludeHighImpact] = useState(false);
    const [sourceMode, setSourceMode] = useState<"strategy" | "wisdom" | "scratch">("strategy");
    const [selectedWisdomTemplateId, setSelectedWisdomTemplateId] = useState<string>("");

    // --- Template Manager State ---
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState<"idle" | "saving" | "saved">("idle");
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

    // --- Analysis State (PEO/Oracle) ---
    const [neuroScore, setNeuroScore] = useState<PEOScore | null>(null);
    const [analyzingPEO, setAnalyzingPEO] = useState(false);
    const [pacingData, setPacingData] = useState<PacingDataPoint[] | null>(null);
    const [oracleData, setOracleData] = useState<OraclePrediction | null>(null);
    const [consultingOracle, setConsultingOracle] = useState(false);

    // --- Vault State ---
    const [savingToVault, setSavingToVault] = useState(false);

    // ------------------------------------------------------------------
    // Effects
    // ------------------------------------------------------------------

    // Load Cortex Profile
    useEffect(() => {
        const stored = localStorage.getItem("nc_cortex_profile");
        if (stored) setCortexProfile(JSON.parse(stored));
    }, []);

    // Load Wisdom & Templates
    useEffect(() => {
        getTemplatesAction("viral-wisdom").then(setWisdomTemplates);
        loadTemplates();
    }, []);

    // Handle Project ID Loading
    useEffect(() => {
        if (projectId) loadStrategyProject(projectId);
    }, [projectId]);

    // Handle Template ID Loading
    useEffect(() => {
        if (templateId) loadSpecificTemplate(templateId);
    }, [templateId]);

    // Handle Tab Param
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && ["strategy", "script", "visuals", "director", "audio", "chat"].includes(tabParam)) {
            // @ts-ignore
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Auto-fill Script Topic from Project
    useEffect(() => {
        if (strategyProject && strategyProject.title && !scriptTopic) {
            const cleanTopic = strategyProject.title.replace("Combo: ", "").replace(/"/g, "").split("+")[0].trim();
            setScriptTopic(cleanTopic.substring(0, 50));
        }
    }, [strategyProject]);


    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Antigravity Auto-Automation: "Immediate Oracle Insight"
    // Automatically consult the Oracle when a new script is generated if data doesn't exist yet.
    useEffect(() => {
        if (scriptResult && !oracleData && !consultingOracle) {
            const contentStr = scriptResult.sections.map(s => s.content).join("\n");
            // Only auto-consult if content is substantial
            if (contentStr.length > 500) {
                const runAutoOracle = async () => {
                    setConsultingOracle(true);
                    try {
                        const res = await predictPerformanceAction(scriptResult.title, contentStr, "Auto-Insight");
                        setOracleData(res);
                    } catch (e) {
                        console.error("Auto-Oracle Failed", e);
                    } finally {
                        setConsultingOracle(false);
                    }
                };
                runAutoOracle();
            }
        }
    }, [scriptResult]);

    // ------------------------------------------------------------------
    // Helpers / Actions
    // ------------------------------------------------------------------

    const loadTemplates = async () => {
        const data = await getTemplatesAction();
        setTemplates(data);
    };

    const loadStrategyProject = async (id: string) => {
        const project = await getProjectByIdAction(id);
        if (project) {
            setStrategyProject(project);
            setStrategyContent(project.format || project.description || "");

            if (project.scriptContent) {
                setContent(project.scriptContent);
                setStep("write");
            }

            if (project.scriptData) {
                setScriptResult(project.scriptData);
                const pacing = calculatePacingProfile(project.scriptData);
                setPacingData(pacing);
            }

            setIsStrategiesMode(true);
            if (project.scriptContent) {
                setActiveTab("script");
            } else {
                setActiveTab("strategy");
            }

            if (project.title && !project.title.includes("Video Project")) {
                setActiveBlueprintName(project.title.replace("Combo: ", ""));
            }
        }
    };

    const loadSpecificTemplate = async (id: string) => {
        const all = await getTemplatesAction();
        const target = all.find(t => t.id === id);
        if (target) {
            handleLoadTemplate(target);
        }
    };

    const handleLoadTemplate = (template: Template) => {
        const isBlueprint = template.type === "viral-wisdom" || template.name.includes("Blueprint") || template.name.includes("🧬");
        setCurrentTemplateId(template.id);

        if (isBlueprint && typeof template.content === 'string') {
            setStrategyContent(template.content);
            setActiveBlueprintName(template.name.replace('🧬 ', ''));
            setActiveTab("script");
        } else if (template.type === "prompt") {
            setVideoPrompts(template.content as VideoPrompt[]);
            setActiveTab("director");
        } else if (template.type === "visual") {
            setImagePrompts(template.content as ScriptImagePrompt[]);
            setActiveTab("visuals");
        } else if (template.type === "audio") {
            setAudioPrompts(template.content as AudioPrompt);
            setActiveTab("audio");
        } else if (Array.isArray(template.content)) {
            const wisdomText = template.content.map((n: any) => {
                if (n.universalLaw) return `## ${n.universalLaw}\n**Principle**: ${n.principle}\n**Explanation**: ${n.explanation}\n**Tip**: ${n.actionableTip}`;
                if (n.principle) return `## ${n.principle}\n${n.explanation}\n> ${n.actionableTip}`;
                return JSON.stringify(n);
            }).join("\n\n---\n\n");
            setStrategyContent(wisdomText);
            setActiveTab("strategy");
        } else if (typeof template.content === 'string') {
            setContent(template.content);
            setActiveTab("script");
            // Parse sections logic...
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
            setStep("write");
        } else {
            setScriptResult(template.content as GeneratedScript);
            if (template.content) {
                const pacing = calculatePacingProfile(template.content as GeneratedScript);
                setPacingData(pacing);
            }
        }
        setShowTemplateManager(false);
    };


    // ------------------------------------------------------------------
    // Event Handlers
    // ------------------------------------------------------------------

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;

        const userMsg: ChatMessage = { role: "user", parts: chatInput };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            // Lazy import to avoid circular issues if any, or standard import
            const { processChat } = await import("@/app/actions");
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
            const { generateScriptAction } = await import("@/app/actions");
            let contextToUse: string | undefined = undefined;

            if (sourceMode === "strategy") {
                contextToUse = strategyContent && strategyContent.length > 20 ? strategyContent : undefined;
            } else if (sourceMode === "wisdom") {
                const template = wisdomTemplates.find(t => t.id === selectedWisdomTemplateId);
                if (template) {
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
                selectedProtocol || undefined,
                undefined, // formatId
                scientificEvidence || undefined
            );
            setScriptResult(data);
            if (data) {
                const fullText = data.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
                setContent(fullText);
                const pacing = calculatePacingProfile(data);
                setPacingData(pacing);

                // Antigravity: Auto-Harvest Wisdom in Background
                import("@/app/actions").then(({ harvestWisdomAction }) => {
                    harvestWisdomAction(fullText, strategyProject?.id || null).then(count => {
                        if (count > 0) console.log(`[Auto-Harvest] Harvested ${count} nuggets.`);
                    });
                });
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
            const { searchOutliersAction, generateBlueprintAction, generateScriptAction, generateVideoPromptsAction, generateAudioPromptsAction, generateScriptImagePromptsAction } = await import("@/app/actions");

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

            addLog(`Emulating viral dna from video ID: ${winner.id}...`);
            const blueprint = await generateBlueprintAction(winner.id, scriptTopic, targetLanguage, cortexProfile || undefined);

            const strategyContext = `
            EMULATED STRATEGY FROM: ${winner.title}
            HOOK STRATEGY: ${blueprint.adaptation.hook}
            STRUCTURE: ${blueprint.adaptation.structure.join(" -> ")}
            CULTURAL TWIST: ${blueprint.adaptation.germanTwist}
            `;
            setStrategyContent(strategyContext);

            setGenesisStatus("WRITING");
            addLog("Synthesizing script with Neuro-Code + Outlier DNA...");
            const script = await generateScriptAction(
                scriptTopic,
                targetLanguage,
                strategyContext,
                cortexProfile?.perfectLoop,
                cortexProfile?.durationConstraint,
                cortexProfile?.metaNarrative,
                selectedProtocol || undefined
            );

            if (!script) throw new Error("Script generation failed");

            setScriptResult(script);
            const fullText = script.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
            setContent(fullText);

            // Antigravity: Auto-Harvest Wisdom in Background
            import("@/app/actions").then(({ harvestWisdomAction }) => {
                harvestWisdomAction(fullText, strategyProject?.id || null).then(count => {
                    if (count > 0) console.log(`[Auto-Harvest] Harvested ${count} nuggets.`);
                });
            });

            setGenesisStatus("IMAGINING");
            addLog("Dreaming up visuals and audio...");

            const [videoPromptsResRaw, audioPromptsRes, imagePromptsRes] = await Promise.all([
                generateVideoPromptsAction(fullText, 10),
                generateAudioPromptsAction(fullText),
                generateScriptImagePromptsAction(fullText)
            ]);

            const videoPromptsRes = videoPromptsResRaw as VideoPrompt[];
            setVideoPrompts(videoPromptsRes);

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
            const { refineScriptAction } = await import("@/app/actions");
            const refined = await refineScriptAction(content, strategyContent, targetLanguage);
            if (refined) {
                setScriptResult(refined);
                const fullText = refined.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
                setContent(fullText);
                const pacing = calculatePacingProfile(refined);
                setPacingData(pacing);
                setStep("visualize");
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
            const { extendScriptAction } = await import("@/app/actions");
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

    const handleCondenseScript = async () => {
        if (!content || condensingScript) return;
        setCondensingScript(true);
        try {
            const { condenseScriptAction } = await import("@/app/actions");
            const condensed = await condenseScriptAction(content, targetLanguage);
            if (condensed) {
                setScriptResult(condensed);
                const fullText = condensed.sections.map(s => `## ${s.heading} (${s.estimatedDuration})\n\n${s.content}\n\n> **Visual:** ${s.visualCue}`).join("\n\n");
                setContent(fullText);
                const pacing = calculatePacingProfile(condensed);
                setPacingData(pacing);
                setStep("visualize");
            }
        } catch (e) {
            console.error(e);
            alert("Condensing failed.");
        } finally {
            setCondensingScript(false);
        }
    };

    const handleSaveProject = async () => {
        const textToSave = content || (scriptResult ? scriptResult.sections.map(s => s.content).join('\n') : "");

        if (!strategyProject) {
            alert("No active project. Please create or select a project first.");
            return;
        }

        setSavingTemplate("saving");

        try {
            await updateProjectAction(strategyProject.id, {
                format: strategyContent,
                scriptContent: textToSave,
                scriptData: scriptResult || undefined,
                title: strategyProject.title
            });

            await loadStrategyProject(strategyProject.id);

            setSavingTemplate("saved");
            setTimeout(() => setSavingTemplate("idle"), 2000);
        } catch (e) {
            console.error("Project Save Failed", e);
            alert("Failed to save project.");
            setSavingTemplate("idle");
        }
    };

    const handleSaveAsBlueprint = async () => {
        if (!strategyContent) return;

        const baseName = strategyProject ? strategyProject.title : "Master Strategy";
        const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const name = `${baseName} (Bluepr. ${date})`;

        setSavingBlueprintStatus("saving");
        await saveTemplateAction(
            "viral-wisdom",
            `🧬 ${name}`,
            strategyContent,
            undefined,
            undefined,
            undefined,
            saveCategory
        );

        setSavingBlueprintStatus("saved");
        await loadTemplates();
        setActiveBlueprintName(name.replace("🧬 ", ""));
        setTimeout(() => setSavingBlueprintStatus("idle"), 2000);
    };

    const handleAnalyzePEO = async () => {
        let textToAnalyze = "";
        if (scriptResult) {
            textToAnalyze = scriptResult.sections.map(s => s.heading + "\n" + s.content).join("\n\n");
        } else {
            textToAnalyze = content || chatInput;
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

    const handleConsultOracle = async () => {
        if (!scriptResult) return;
        const c = scriptResult.sections.map(s => s.content).join("\n\n");
        setConsultingOracle(true);
        try {
            const res = await predictPerformanceAction(scriptResult.title, c, "Auto-generated from content");
            setOracleData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setConsultingOracle(false);
        }
    };

    const handleThumbnailCritique = async () => {
        if (!thumbnailConcept.trim()) return;
        setActiveTab("chat");
        const prompt = `critique this thumbnail concept for a 35+ male engineer audience: "${thumbnailConcept}".
        
        Rules:
        1. Is it "Hype" (Bad) or "Intrigue" (Good)?
        2. Does it visually promise a "System" or "Insight"?
        3. Rate it 1-10 on "Clickworthiness for Smart People".
        4. Suggest 1 specific improvement to make it more "High-Level".`;

        setMessages(prev => [...prev, { role: "user", parts: prompt }]);
        setChatLoading(true);
        try {
            const { processChat } = await import("@/app/actions");
            const response = await processChat(messages, prompt);
            setMessages(prev => [...prev, { role: "model", parts: response }]);
        } catch (e) {
            console.error(e);
        } finally {
            setChatLoading(false);
        }
    };

    const handlePreMortem = async () => {
        setActiveTab("chat");
        const title = strategyProject?.title || scriptTopic || "Current Project";
        const prompt = `Initiate the 'Pre-Mortem Protocol' for the project: "${title}".
        
        Your Goal: Be a "Devil's Advocate" for the 35+ Engineer Audience.
        1. PREDICT: Based on the title/topic, what is the #1 reason this specific video might FAIL or be BORING?
        2. ASK: "I see a risk of [Prediction]. How will you prevent this?"
        
        Do not just list generic questions. Give a specific prognosis.`;

        setMessages(prev => [...prev, { role: "user", parts: prompt }]);
        setChatLoading(true);
        try {
            const { processChat } = await import("@/app/actions");
            const response = await processChat(messages, prompt);
            setMessages(prev => [...prev, { role: "model", parts: response }]);
        } catch (e) {
            console.error(e);
        } finally {
            setChatLoading(false);
        }
    };

    // Return everything
    return {
        // ... (Previous State Returns)
        strategyProject, setStrategyProject,
        strategyContent, setStrategyContent,
        isStrategiesMode, setIsStrategiesMode,
        analyzingStrategy, setAnalyzingStrategy,
        cortexProfile, setCortexProfile,
        content, setContent,
        scriptTopic, setScriptTopic,
        thumbnailConcept, setThumbnailConcept,
        scriptResult, setScriptResult,
        scriptLoading, setScriptLoading,
        targetLanguage, setTargetLanguage,
        selectedProtocol, setSelectedProtocol,
        activeTab, setActiveTab,
        activeBlueprintName, setActiveBlueprintName,
        step, setStep,
        isBlueprintEngineOpen, setIsBlueprintEngineOpen,
        refiningScript, setRefiningScript,
        extendingScript, setExtendingScript,
        condensingScript, setCondensingScript,
        savingStrategyStatus, setSavingStrategyStatus,
        savingBlueprintStatus, setSavingBlueprintStatus,
        saveCategory, setSaveCategory,
        videoPrompts, setVideoPrompts,
        imagePrompts, setImagePrompts,
        audioPrompts, setAudioPrompts,
        generatingImages, setGeneratingImages,
        savingImages, setSavingImages,
        generatingAudio, setGeneratingAudio,
        savingAudio, setSavingAudio,
        generatingPrompts, setGeneratingPrompts,
        savingPrompts, setSavingPrompts,
        copiedPromptId, setCopiedPromptId,
        genesisMode, setGenesisMode,
        genesisStatus, setGenesisStatus,
        genesisLogs, setGenesisLogs,
        messages, setMessages,
        chatInput, setChatInput,
        chatLoading, setChatLoading,
        scrollRef,
        wisdomTemplates, setWisdomTemplates,
        selectedWisdomIds, setSelectedWisdomIds,
        autoIncludeHighImpact, setAutoIncludeHighImpact,
        sourceMode, setSourceMode,
        selectedWisdomTemplateId, setSelectedWisdomTemplateId,
        templates, setTemplates,
        showTemplateManager, setShowTemplateManager,
        savingTemplate, setSavingTemplate,
        currentTemplateId, setCurrentTemplateId,
        neuroScore, setNeuroScore,
        analyzingPEO, setAnalyzingPEO,
        pacingData, setPacingData,
        oracleData, setOracleData,
        consultingOracle, setConsultingOracle,
        savingToVault, setSavingToVault,

        // Handlers
        handleLoadTemplate,
        loadTemplates,
        loadStrategyProject,
        handleChatSubmit,
        handleScriptGenerate,
        handleGenesis,
        handleRefineScript,
        handleExtendScript,
        handleCondenseScript,
        handleSaveProject,
        handleSaveAsBlueprint,
        handleAnalyzePEO,
        handleConsultOracle,
        handleThumbnailCritique,
        handlePreMortem,

        // Phase 5.5: Science Evidence
        scientificEvidence, setScientificEvidence
    };
}
