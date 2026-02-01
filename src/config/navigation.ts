
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
    Notebook,         // Noteobok
    Map              // Canvas
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
    { group: "SYSTEM", name: "Dashboard", href: "/", icon: Home, subtitle: "Mission Control", color: "#F8FAFC" },

    { group: "VISIONARY", name: "Virt Vision", href: "/vision", icon: Eye, subtitle: "Future Concept", color: "#D946EF" },
    { group: "VISIONARY", name: "Brain Build", href: "/brain-story", icon: History, subtitle: "Origin Story", color: "#F472B6" },

    // BIO-OS: Teals & Turquoise
    { group: "BIO-OS", name: "The Upgrade", href: "/upgrade", icon: Zap, subtitle: "Neuro-Priming (15m)", color: "#2DD4BF" }, // Teal-400
    { group: "BIO-OS", name: "Neuro-Sync", href: "/sync", icon: Activity, subtitle: "Flow State Audio", color: "#14B8A6" },   // Teal-500
    { group: "BIO-OS", name: "Micro-Protocols", href: "/protocols", icon: Workflow, subtitle: "Acute Solutions", color: "#06B6D4" }, // Cyan-500

    // SIGNALS: Blues & Indigos
    { group: "SIGNALS", name: "Scanner", href: "/scanner", icon: Radar, subtitle: "Trend Scout", color: "#38BDF8" },
    { group: "SIGNALS", name: "Analytics", href: "/feedback", icon: Activity, subtitle: "Channel Intelligence", color: "#60A5FA" },
    { group: "SIGNALS", name: "Wisdom", href: "/wisdom?filter=LAW", icon: GraduationCap, subtitle: "Knowledge Extraction", color: "#818CF8" },
    { group: "SIGNALS", name: "Canvas", href: "/cortex", icon: Map, subtitle: "Knowledge Graph", color: "#A855F7" }, // Purple

    // PRODUCTION: Greens
    { group: "PRODUCTION", name: "Architect", href: "/architect?tab=script", icon: PencilRuler, subtitle: "Strategy & Script", color: "#4ADE80" }, // Green-400
    { group: "PRODUCTION", name: "Director", href: "/architect?tab=director", icon: Film, subtitle: "Visuals", color: "#22C55E" },         // Green-500

    { group: "PRODUCTION", name: "Distribution", href: "/packaging", icon: Package, subtitle: "SEO & Packaging", color: "#16A34A" }, // Green-600

    { group: "SYSTEM", name: "Notebook", href: "/notebook", icon: Notebook, subtitle: "Pipeline & Tasks", color: "#F59E0B" },
    { group: "SYSTEM", name: "Core Identity", href: "/core-identity", icon: Brain, subtitle: "Strategy Core", color: "#64748B" }, // Slate-500
    { group: "SYSTEM", name: "Vault", href: "/vault", icon: Database, subtitle: "Assets", color: "#94A3B8" }, // Slate-400
    { group: "SYSTEM", name: "Settings", href: "/settings", icon: Settings, subtitle: "Config", color: "#CBD5E1" }, // Slate-300

];

export const GROUP_COLORS: Record<string, string> = {
    "VISIONARY": "#D946EF",
    "BIO-OS": "#2DD4BF",
    "SIGNALS": "#38BDF8",
    "PRODUCTION": "#4ADE80",
    "SYSTEM": "#94A3B8",

};
