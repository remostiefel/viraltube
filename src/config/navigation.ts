
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
    BookOpen         // Facts
} from "lucide-react";

export type NavItem = {
    name: string;
    href: string;
    icon: any;
    subtitle?: string;
    group: string;
    color?: string;
};

export const navigation: NavItem[] = [
    { group: "DASHBOARD", name: "Dashboard", href: "/", icon: Home, subtitle: "Mission Control", color: "#FFFFFF" },
    { group: "DASHBOARD", name: "Project Hub", href: "/projects", icon: FolderOpen, subtitle: "Manage Work" },

    { group: "BRAIN", name: "Identity Core", href: "/cortex", icon: Brain, subtitle: "Strategy" },

    // THE 3 PILLARS OF WISDOM
    { group: "BRAIN", name: "Axioms", href: "/wisdom?filter=LAW", icon: GraduationCap, subtitle: "Laws (Mandatory)", color: "#FACC15" },
    { group: "BRAIN", name: "Creator Growth", href: "/wisdom?filter=GROWTH", icon: TrendingUp, subtitle: "Meta (Advisory)", color: "#EF4444" },
    { group: "BRAIN", name: "Topic Research", href: "/wisdom?filter=FACT", icon: BookOpen, subtitle: "Facts (Optional)", color: "#22C55E" },

    { group: "BRAIN", name: "Agents Crew", href: "/studio", icon: Code, subtitle: "System Prompts" },

    { group: "INPUT", name: "Scanner", href: "/scanner", icon: Radar, subtitle: "Discovery", color: "#38BDF8" },
    { group: "INPUT", name: "Viral Decoder", href: "/iterative-loop", icon: Microscope, subtitle: "Deep Analysis" },
    { group: "INPUT", name: "The Oracle", href: "/oracle", icon: Sparkles, subtitle: "Prediction" },
    { group: "INPUT", name: "Cloud Vault", href: "/vault", icon: Database, subtitle: "Assets" },

    { group: "FACTORY", name: "Flow Engine", href: "/pipelines", icon: Workflow, subtitle: "Creation" },
    { group: "FACTORY", name: "Script Forge", href: "/architect", icon: PencilRuler, subtitle: "Writing", color: "#4ADE80" },
    { group: "FACTORY", name: "Pixel Foundry", href: "/visualizer", icon: Image, subtitle: "Visuals" },
    { group: "FACTORY", name: "Sonic Lab", href: "/sonic", icon: Music, subtitle: "Audio" },

    { group: "OUTPUT", name: "Launch Control", href: "/packaging", icon: Package, subtitle: "Deployment", color: "#EF4444" },
    { group: "OUTPUT", name: "Archives", href: "/artifacts", icon: FileText, subtitle: "Downloads" },

    { group: "LOOP", name: "Data Mirror", href: "/feedback", icon: Activity, subtitle: "Insights", color: "#EC4899" },
    { group: "LOOP", name: "Bio-Link", href: "/bio", icon: Zap, subtitle: "Operator State", color: "#8B5CF6" },

    { group: "SUPPORT", name: "Knowledge Base", href: "/help", icon: HelpCircle, subtitle: "Help", color: "#FFFFFF" },
];

export const GROUP_COLORS: Record<string, string> = {
    "DASHBOARD": "var(--neuro-dashboard)",
    "BRAIN": "var(--neuro-brain)",
    "INPUT": "var(--neuro-input)",
    "FACTORY": "var(--neuro-factory)",
    "OUTPUT": "var(--neuro-output)",
    "LOOP": "var(--neuro-loop)",
    "SUPPORT": "var(--neuro-support)"
};
