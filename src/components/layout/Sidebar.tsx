"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { navigation, GROUP_COLORS, NavItem } from "@/config/navigation";

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();

    // Group items
    const groups = navigation.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    return (
        <div className={cn("flex flex-col h-full bg-card border-r border-border/30 shadow-xl z-50 transition-all duration-300", isMobile ? "w-[60px]" : "w-64")}>
            <div className={cn("transition-all", isMobile ? "p-3" : "p-6")}>
                <h1 className={cn("text-2xl font-bold tracking-tighter bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2", isMobile && "justify-center")}>
                    <Brain className={cn("text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all", isMobile ? "w-6 h-6" : "w-8 h-8")} />
                    {!isMobile && (
                        <div className="flex flex-col leading-none">
                            <span className="text-2xl tracking-tighter text-cyan-400 drop-shadow-md">CORTEX</span>
                            <span className="text-[10px] font-black uppercase text-[#FF0000] tracking-[0.35em] bg-white/5 rounded-sm px-0.5 text-center -mt-1 shadow-[0_0_10px_rgba(255,0,0,0.3)]">
                                automated
                            </span>
                        </div>
                    )}
                </h1>
            </div>

            <nav className="flex-1 px-2 space-y-2 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-primary/20">
                {Object.entries(groups).map(([groupName, items], idx) => {
                    const groupColor = GROUP_COLORS[groupName] || "var(--foreground)";

                    return (
                        <div key={groupName} className={cn("pt-2", idx > 0 && "border-t border-border/30")}>
                            {!isMobile && (
                                <h3
                                    className="text-[11px] uppercase font-bold tracking-wider mb-1.5 px-2 py-1 rounded border border-current/30 bg-current/10"
                                    style={{ color: groupColor }}
                                >
                                    {groupName}
                                </h3>
                            )}
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
                                                    "flex items-center gap-2 text-sm font-medium transition-all duration-200 rounded-lg group relative overflow-hidden flex-1",
                                                    isMobile ? "px-0 py-2 justify-center" : "px-3 py-1.5",
                                                    isActive
                                                        ? "bg-[rgba(255,255,255,0.1)] shadow-[inset_3px_0_0_0_currentColor]"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                )}
                                                style={displayColor ? { color: displayColor } : {}}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "transition-colors",
                                                        isMobile ? "w-5 h-5" : "w-5 h-5",
                                                        (!isActive && !item.color) && "text-muted-foreground group-hover:text-foreground/80"
                                                    )}
                                                    style={displayColor ? { color: displayColor } : {}}
                                                />
                                                {!isMobile && (
                                                    <div className="flex flex-col">
                                                        <span>{item.name}</span>
                                                    </div>
                                                )}

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

            <div className={cn("border-t border-border/30 bg-muted/10", isMobile ? "p-2" : "p-4")}>
                <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    {!isMobile && <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>}
                </div>
            </div>
        </div>
    );
}
