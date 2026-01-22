"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { navigation, GROUP_COLORS, NavItem } from "@/config/navigation";

export function Sidebar() {
    const pathname = usePathname();

    // Group items
    const groups = navigation.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    return (
        <div className="flex flex-col h-full w-64 bg-card border-r border-border/30 shadow-xl z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tighter bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Brain className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div>
                        VIRAL<span> TUBE</span>
                        <span className="text-xs block font-mono text-red-500 tracking-widest mt-0.5 lowercase font-bold">
                            automated growth
                        </span>
                    </div>
                </h1>
            </div>

            <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-primary/20">
                {Object.entries(groups).map(([groupName, items]) => {
                    const groupColor = GROUP_COLORS[groupName] || "var(--foreground)";

                    return (
                        <div key={groupName}>
                            <h3
                                className="text-[10px] uppercase font-bold tracking-wider mb-2 px-3 opacity-60"
                                style={{ color: groupColor }}
                            >
                                {groupName}
                            </h3>
                            <div className="space-y-1">
                                {items.map((item) => {
                                    const isActive = pathname === item.href;
                                    const activeColor = item.color || groupColor;
                                    const displayColor = item.color || (isActive ? groupColor : undefined);

                                    return (
                                        <Tooltip key={item.name} content={item.subtitle || item.name} side="right">
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg group relative overflow-hidden flex-1",
                                                    isActive
                                                        ? "bg-[rgba(255,255,255,0.1)] shadow-[inset_3px_0_0_0_currentColor]"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                )}
                                                style={displayColor ? { color: displayColor } : {}}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "w-5 h-5 transition-colors",
                                                        (!isActive && !item.color) && "text-muted-foreground group-hover:text-foreground/80"
                                                    )}
                                                    style={displayColor ? { color: displayColor } : {}}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                </div>

                                                {isActive && (
                                                    <div
                                                        className="absolute inset-0 pointer-events-none opacity-10"
                                                        style={{ background: `linear-gradient(to right, ${activeColor}, transparent)` }}
                                                    />
                                                )}
                                            </Link>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/30 bg-muted/10">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>
                </div>
            </div>
        </div>
    );
}
