"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive" | "info";

export interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: ToastVariant;
}

interface ToastContextType {
    toast: (props: Omit<Toast, "id">) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, title, description, variant };
        setToasts((prev) => [...prev, newToast]);

        // Auto dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastViewport toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
}

function ToastViewport({
    toasts,
    dismiss,
}: {
    toasts: Toast[];
    dismiss: (id: string) => void;
}) {
    return (
        <div className="fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "pointer-events-auto flex items-start w-full gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full transition-all duration-300",
                        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                        t.variant === "default" && "border-border text-foreground",
                        t.variant === "success" && "border-green-500/50 bg-green-500/10 text-green-500",
                        t.variant === "destructive" && "border-red-500/50 bg-red-500/10 text-red-500",
                        t.variant === "info" && "border-blue-500/50 bg-blue-500/10 text-blue-500"
                    )}
                >
                    <div className="shrink-0 mt-0.5">
                        {t.variant === "success" && <CheckCircle className="w-5 h-5" />}
                        {t.variant === "destructive" && <AlertCircle className="w-5 h-5" />}
                        {t.variant === "info" && <Info className="w-5 h-5" />}
                        {t.variant === "default" && <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 grid gap-1">
                        <div className="text-sm font-semibold">{t.title}</div>
                        {t.description && (
                            <div className="text-sm opacity-90">{t.description}</div>
                        )}
                    </div>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="shrink-0 text-foreground/50 hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
