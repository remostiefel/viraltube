"use client";

import { motion } from "framer-motion";
import { Zap, Code, Users, Scan, Star } from "lucide-react";

const Icons: Record<string, any> = {
    zap: Zap,
    code: Code,
    users: Users,
    scan: Scan,
    star: Star
};

export default function StoryNode({ data, index }: { data: any, index: number }) {
    const Icon = Icons[data.icon] || Star;
    const isEven = index % 2 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`flex items-start gap-8 relative ${isEven ? "flex-row" : "flex-row-reverse text-right"}`}
        >
            {/* Center Line and Dot */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10" />
            </div>

            {/* Content Card */}
            <div className={`w-1/2 ${isEven ? "pr-12 text-right" : "pl-12 text-left"}`}>
                <div className="text-xs font-bold text-purple-400 tracking-widest mb-2 uppercase">{data.date}</div>
                <h3 className="text-2xl font-bold text-white mb-4 font-mono">{data.title}</h3>
                <div className={`p-6 rounded-2xl border bg-card/30 backdrop-blur-sm shadow-xl inline-block
                    ${data.type === "VISION" ? "border-yellow-500/50 bg-yellow-500/5" : "border-border/40"}
                `}>
                    <p className="text-sm text-gray-300 leading-relaxed max-w-md">{data.content}</p>

                    {data.codeSnippet && (
                        <div className="mt-4 p-3 bg-black/50 rounded-lg text-xs font-mono text-green-400 text-left border border-white/5">
                            {data.codeSnippet}
                        </div>
                    )}
                </div>
            </div>

            {/* Spacer for the other side */}
            <div className="w-1/2" />
        </motion.div>
    );
}
