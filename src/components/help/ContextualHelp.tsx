"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface ContextualHelpProps {
    title: string;
    content: string;
    trigger?: React.ReactNode;
}

export function ContextualHelp({ title, content, trigger }: ContextualHelpProps) {
    // Combine title and content for the simple tooltip
    const tooltipText = `${title}: ${content}`;

    return (
        <Tooltip content={tooltipText} side="right">
            <span className="cursor-help inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                {trigger || <HelpCircle size={14} />}
            </span>
        </Tooltip>
    );
}
