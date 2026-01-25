"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Palette, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"cyan" | "gold" | "amber">("cyan");

    // Load theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("neuro-theme") as "cyan" | "gold" | "amber";
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: "cyan" | "gold" | "amber") => {
        const root = document.documentElement;
        root.classList.remove("theme-gold", "theme-amber");
        if (newTheme === "gold") {
            root.classList.add("theme-gold");
        } else if (newTheme === "amber") {
            root.classList.add("theme-amber");
        }
    };

    const toggleTheme = () => {
        let newTheme: "cyan" | "gold" | "amber" = "cyan";
        if (theme === "cyan") newTheme = "gold";
        else if (theme === "gold") newTheme = "amber";
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
            default:
                return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20";
        }
    };

    const getThemeLabel = () => {
        switch (theme) {
            case "gold": return "Gold State";
            case "amber": return "Amber Flow";
            default: return "Cyan Mode";
        }
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "gold": return <Sun className="w-4 h-4" />;
            case "amber": return <Zap className="w-4 h-4" />;
            default: return <Palette className="w-4 h-4" />;
        }
    };

    const getGlowColor = () => {
        switch (theme) {
            case "gold": return "bg-yellow-500";
            case "amber": return "bg-amber-500";
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
