"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const offsets = {
        top: { bottom: "100%", left: "50%", x: "-50%", mb: "10px" },
        bottom: { top: "100%", left: "50%", x: "-50%", mt: "10px" },
        left: { right: "100%", top: "50%", y: "-50%", mr: "10px" },
        right: { left: "100%", top: "50%", y: "-50%", ml: "10px" }
    };

    const style = offsets[side];

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            ...style,
                            zIndex: 60
                        }}
                        className="bg-popover text-popover-foreground text-xs px-3 py-1.5 rounded-lg shadow-xl border border-primary/20 whitespace-nowrap pointer-events-none"
                    >
                        {content}
                        <div className={`absolute w-2 h-2 bg-popover border-primary/20 transform rotate-45 
                            ${side === "top" ? "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r" : ""}
                            ${side === "bottom" ? "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l" : ""}
                            ${side === "left" ? "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r" : ""}
                            ${side === "right" ? "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l" : ""}
                        `} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
