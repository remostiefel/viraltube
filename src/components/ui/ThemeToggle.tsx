"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Palette, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"cyan" | "gold" | "amber" | "sun">("cyan");

    // Load theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("neuro-theme") as "cyan" | "gold" | "amber" | "sun";
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: "cyan" | "gold" | "amber" | "sun") => {
        const root = document.documentElement;
        root.classList.remove("theme-gold", "theme-amber", "theme-sun");
        if (newTheme === "gold") {
            root.classList.add("theme-gold");
        } else if (newTheme === "amber") {
            root.classList.add("theme-amber");
        } else if (newTheme === "sun") {
            root.classList.add("theme-sun");
        }
    };

    const toggleTheme = () => {
        let newTheme: "cyan" | "gold" | "amber" | "sun" = "cyan";
        if (theme === "cyan") newTheme = "gold";
        else if (theme === "gold") newTheme = "amber";
        else if (theme === "amber") newTheme = "sun";
        else newTheme = "cyan"; // back to cyan

        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem("neuro-theme", newTheme);
    };

    const getThemeStyles = () => {
        switch (theme) {
            case "gold":
                return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20";
            case "amber":
                return "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20";
            case "sun":
                return "bg-yellow-400/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20";
            default:
                return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20";
        }
    };

    const getThemeLabel = () => {
        switch (theme) {
            case "gold": return "Gold State";
            case "amber": return "Amber Flow";
            case "sun": return "Sun Mode";
            default: return "Cyan Mode";
        }
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "gold": return <Sparkles className="w-4 h-4" />;
            case "amber": return <Zap className="w-4 h-4" />;
            case "sun": return <Sun className="w-4 h-4" />;
            default: return <Palette className="w-4 h-4" />; // Cyan default
        }
    };

    const getGlowColor = () => {
        switch (theme) {
            case "gold": return "bg-yellow-500";
            case "amber": return "bg-amber-500";
            case "sun": return "bg-yellow-300";
            default: return "bg-cyan-400";
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 overflow-hidden",
                getThemeStyles()
            )}
            title="Switch Neuro-Interface Theme"
        >
            <motion.div
                key={theme}
                initial={{ rotate: -20, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {getThemeIcon()}
            </motion.div>

            <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">
                {getThemeLabel()}
            </span>

            {/* Glow Effect */}
            <div className={cn(
                "absolute inset-0 blur-xl opacity-20 pointer-events-none",
                getGlowColor()
            )} />
        </button>
    );
}
