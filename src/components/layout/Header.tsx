"use client";

import { useState } from "react";
import { Bell, Search, RotateCcw, RotateCw } from "lucide-react";
import { useActionHistory } from "@/components/context/ActionHistoryContext";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
    const { undo, redo, canUndo, canRedo, undoStack, redoStack } = useActionHistory();
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);

    return (
        <header className="h-16 border-b border-border/30 bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                {/* Breadcrumb or Page Title could go here */}
                <div className="flex items-center text-sm font-mono text-muted-foreground mr-4">
                    <span className="text-primary mr-2">●</span> SYSTEM ONLINE
                </div>

                {/* Undo / Redo Controls */}
                <div className="flex items-center gap-2 bg-card border border-primary/20 p-1.5 rounded-full shadow-sm ml-4">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${canUndo ? "text-primary hover:bg-orange-500 hover:text-white active:scale-90" : "text-muted-foreground/30 cursor-not-allowed"}`}
                        title={canUndo ? `Undo: ${undoStack[undoStack.length - 1].description}` : "Nothing to undo"}
                        style={{ minWidth: '28px', minHeight: '28px' }}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border/50" />
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${canRedo ? "text-primary hover:bg-green-500 hover:text-white active:scale-90" : "text-muted-foreground/30 cursor-not-allowed"}`}
                        title={canRedo ? `Redo: ${redoStack[0].description}` : "Nothing to redo"}
                        style={{ minWidth: '28px', minHeight: '28px' }}
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search database..."
                        className="bg-muted/50 border border-border/30 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground w-64 placeholder:text-muted-foreground"
                    />
                </div>
                <button
                    className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setHasUnread(false);
                    }}
                >
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                </button>

                {isOpen && (
                    <div className="absolute top-16 right-8 w-80 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div className="p-3 bg-muted/30 rounded border border-border/30 text-sm p-2">
                                <div className="font-medium text-primary text-xs mb-1">SYSTEM</div>
                                <p className="text-muted-foreground">All systems operational. No new alerts.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
