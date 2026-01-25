"use client";

import { motion } from "framer-motion";
import {
    Code, Terminal, Calendar, Activity,
    Zap, Scan, Layout, Lock, Video, Image, Eye, Book, Star
} from "lucide-react";

const IconMap: Record<string, any> = {
    zap: Zap,
    scan: Scan,
    columns: Layout,
    lock: Lock,
    video: Video,
    image: Image,
    eye: Eye,
    book: Book,
    code: Code,
    default: Star
};

interface StoryNodeProps {
    data: {
        title: string;
        date: string;
        content: string;
        codeSnippet?: string;
        icon?: string;
        type?: string;
    };
    index: number;
}

export default function StoryNode({ data, index }: StoryNodeProps) {
    const isLeft = index % 2 === 0;
    const Icon = IconMap[data.icon || "default"] || IconMap.default;
    const { title, date, content, codeSnippet } = data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`flex w-full mb-16 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
        >
            {/* Content Card */}
            <div className={`w-[45%] ${isLeft ? "text-right pr-8" : "text-left pl-8"}`}>
                <div className={`inline-flex items-center gap-2 mb-2 ${isLeft ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[#66FCF1] font-mono text-xs px-2 py-0.5 rounded bg-[#66FCF1]/10 border border-[#66FCF1]/20">
                        {date}
                    </span>
                    {Icon && <Icon size={16} className="text-[#F472B6]" />}
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{content}</p>

                {codeSnippet && (
                    <div className={`bg-[#0B0C10] border border-[#1F2833] rounded-lg p-3 text-left overflow-x-auto ${isLeft ? "ml-auto" : "mr-auto"} w-fit max-w-full`}>
                        <div className="flex items-center gap-2 mb-2 border-b border-[#1F2833] pb-2">
                            <Terminal size={12} className="text-gray-500" />
                            <span className="text-[10px] text-gray-500">source_fragment.ts</span>
                        </div>
                        <pre className="text-[10px] text-[#A855F7] font-mono">
                            <code>{codeSnippet}</code>
                        </pre>
                    </div>
                )}
            </div>

            {/* Center Timeline */}
            <div className="w-[10%] flex flex-col items-center relative">
                {/* Line */}
                <div className="h-full w-px bg-gradient-to-b from-[#1F2833] via-[#66FCF1]/50 to-[#1F2833] absolute top-0" />

                {/* Node Dot */}
                <div className="w-4 h-4 rounded-full bg-[#050608] border-2 border-[#66FCF1] z-10 mt-1 shadow-[0_0_10px_#66FCF1]" />

                {/* Pulse Effect */}
                <div className="w-8 h-8 rounded-full bg-[#66FCF1]/20 absolute top-0 -mt-1 animate-ping" />
            </div>

            {/* Empty Space for Balance */}
            <div className="w-[45%]" />
        </motion.div>
    );
}
