import { Zap, Users, Target, Crown, Eye } from "lucide-react";

export interface Milestone {
    id: string;
    title: string;
    threshold: number;
    type: "subs" | "views" | "wisdom" | "projects";
    icon: any;
    description: string;
}

export const MILESTONES: Milestone[] = [
    // Subscriber Milestones
    { id: "sub-50", title: "The First 50", threshold: 50, type: "subs", icon: Users, description: "Seed community." },
    { id: "sub-100", title: "The First 100", threshold: 100, type: "subs", icon: Users, description: "Your first community." },
    { id: "sub-200", title: "200 Strong", threshold: 200, type: "subs", icon: Users, description: "Doubling down." },
    { id: "sub-300", title: "Spartan 300", threshold: 300, type: "subs", icon: Users, description: "Small army achieved." },
    { id: "sub-500", title: "Half a Thousand", threshold: 500, type: "subs", icon: Users, description: "Halfway to monetization." },
    { id: "sub-1k", title: "Club 1,000", threshold: 1000, type: "subs", icon: Crown, description: "Monetization territory." },
    { id: "sub-1500", title: "1.5k Growth", threshold: 1500, type: "subs", icon: Users, description: "Steady climb." },
    { id: "sub-2000", title: "2k Followers", threshold: 2000, type: "subs", icon: Users, description: "Establishing presence." },
    { id: "sub-5k", title: "5k Authority", threshold: 5000, type: "subs", icon: Users, description: "Micro-influencer status." },
    { id: "sub-10k", title: "The 10k Tribe", threshold: 10000, type: "subs", icon: Crown, description: "Authority status unlocked." },

    // View Milestones
    { id: "view-500", title: "500 Views", threshold: 500, type: "views", icon: Eye, description: "First attention." },
    { id: "view-1k", title: "1,000 Eyeballs", threshold: 1000, type: "views", icon: Eye, description: "Visibility achieved." },
    { id: "view-5k", title: "5,000 Views", threshold: 5000, type: "views", icon: Eye, description: "Real traction." },
    { id: "view-10k", title: "10,000 Views", threshold: 10000, type: "views", icon: Eye, description: "Momentum building." },
    { id: "view-25k", title: "25k Views", threshold: 25000, type: "views", icon: Eye, description: "Serious reach." },
    { id: "view-50k", title: "50k Views", threshold: 50000, type: "views", icon: Eye, description: "Audience expanding." },
    { id: "view-100k", title: "100k Club", threshold: 100000, type: "views", icon: Crown, description: "Viral potential unlocked." },
    { id: "view-500k", title: "Half Million", threshold: 500000, type: "views", icon: Eye, description: "Major impact." },
    { id: "view-1m", title: "1 Million Views", threshold: 1000000, type: "views", icon: Crown, description: "Master of Attention." },

    // App Usage Milestones (Neuro-Evolution)
    { id: "proj-1", title: "First Creation", threshold: 1, type: "projects", icon: Zap, description: "A script is born." },
    { id: "proj-3", title: "Hat Trick", threshold: 3, type: "projects", icon: Zap, description: "Consistency starts." },
    { id: "proj-5", title: "High Five", threshold: 5, type: "projects", icon: Zap, description: "Regular production." },
    { id: "proj-10", title: "Prolific Creator", threshold: 10, type: "projects", icon: Zap, description: "Building a library." },
    { id: "proj-25", title: "Content Machine", threshold: 25, type: "projects", icon: Zap, description: "Serious volume." },

    { id: "nugget-10", title: "Wisdom Seeker", threshold: 10, type: "wisdom", icon: Target, description: "Extracting truth." },
    { id: "nugget-25", title: "Truth Hunter", threshold: 25, type: "wisdom", icon: Target, description: "Pattern recognition." },
    { id: "nugget-50", title: "Knowledge Hoarder", threshold: 50, type: "wisdom", icon: Target, description: "Building a second brain." },
    { id: "nugget-100", title: "Sage Status", threshold: 100, type: "wisdom", icon: Crown, description: "Deep wisdom achieved." },
];
