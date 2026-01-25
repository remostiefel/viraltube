
import {
    Radar,           // Scanner
    PencilRuler,     // Architect
    Image,           // Visualizer
    Music,           // Sonic
    Package,         // Packaging
    FileText,        // Artifacts
    Activity,        // Feedback
    Settings,
    Brain,           // Cortex
    Workflow,        // Pipelines
    Home,            // Dashboard
    Zap,             // Bio
    Code,            // Studio
    Database,        // Vault
    HelpCircle,      // Help
    Microscope,      // Viral Decoder
    Sparkles,         // Oracle
    FolderOpen,      // Projects
    GraduationCap,    // Wisdom
    TrendingUp,      // Growth
    BookOpen,        // Facts
    Film,            // Director
    Eye,             // Virt Vision
    History,          // Brain Build
    Notebook         // Noteobok
} from "lucide-react";

export type NavItem = {
    name: string;
    href: string;
    icon: any;
    subtitle?: string;
    group: string;
    color?: string;
};

// Neuro-Code OS Navigation
export const navigation: NavItem[] = [
    { group: "SYSTEM", name: "Dashboard", href: "/", icon: Home, subtitle: "Mission Control", color: "#FFFFFF" },

    { group: "VISIONARY", name: "Virt Vision", href: "/vision", icon: Eye, subtitle: "Future Concept", color: "#D946EF" },
    { group: "VISIONARY", name: "Brain Build", href: "/brain-story", icon: History, subtitle: "Origin Story", color: "#F472B6" },

    { group: "BIO-OS", name: "The Upgrade", href: "/upgrade", icon: Zap, subtitle: "Neuro-Priming (15m)", color: "#2DD4BF" },
    { group: "BIO-OS", name: "Neuro-Sync", href: "/sync", icon: Activity, subtitle: "Flow State Audio", color: "#A855F7" },
    { group: "BIO-OS", name: "Micro-Protocols", href: "/protocols", icon: Workflow, subtitle: "Acute Solutions" },

    { group: "SIGNALS", name: "Scanner", href: "/scanner", icon: Radar, subtitle: "Trend Scout", color: "#38BDF8" },
    { group: "SIGNALS", name: "Wisdom", href: "/wisdom?filter=LAW", icon: GraduationCap, subtitle: "Knowledge Extraction" },

    { group: "PRODUCTION", name: "Architect", href: "/architect?tab=script", icon: PencilRuler, subtitle: "Strategy & Script", color: "#4ADE80" },
    { group: "PRODUCTION", name: "Director", href: "/architect?tab=director", icon: Film, subtitle: "Visuals", color: "#EC4899" },

    { group: "SYSTEM", name: "Notebook", href: "/notebook", icon: Notebook, subtitle: "Pipeline & Tasks", color: "#F59E0B" },
    { group: "SYSTEM", name: "Cortex", href: "/cortex", icon: Brain, subtitle: "Strategy Core" },
    { group: "SYSTEM", name: "Vault", href: "/vault", icon: Database, subtitle: "Assets" },
    { group: "SYSTEM", name: "Settings", href: "/settings", icon: Settings, subtitle: "Config" },


];

export const GROUP_COLORS: Record<string, string> = {
    "VISIONARY": "#D946EF",
    "BIO-OS": "#2DD4BF",
    "SIGNALS": "#38BDF8",
    "PRODUCTION": "#4ADE80",
    "SYSTEM": "#94A3B8",

};
