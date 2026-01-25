"use client";

import { motion } from "framer-motion";
import { Brain, ArrowDown } from "lucide-react";
import StoryNode from "@/components/brain-story/StoryNode";

import { BRAIN_BUILD_HISTORY } from "@/components/brain-story/brainBuildData";
import { BRAIN_STORY } from "@/components/story/mockData"; // Keeping for reference if needed, or remove.

export default function BrainStoryPage() {
    return (
        <div className="min-h-screen bg-[#050608] text-gray-200 font-sans overflow-x-hidden">
            {/* Hero Section */}
            <div className="h-[60vh] flex flex-col items-center justify-center relative border-b border-[#1F2833]/50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1F2833_0%,_transparent_70%)] opacity-30" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="text-center z-10"
                >
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-[#66FCF1]/10 rounded-full border border-[#66FCF1]/30 shadow-[0_0_30px_#66FCF1_inset]">
                            <Brain size={64} className="text-[#66FCF1]" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white mb-4">BRAIN BUILD</h1>
                    <p className="text-[#45A29E] font-mono text-lg uppercase tracking-[0.5em]">The Evolution of Intelligence</p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 2, duration: 2, repeat: Infinity }}
                    className="absolute bottom-10"
                >
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest text-center">Scroll to Trace</div>
                    <ArrowDown className="w-4 h-4 text-[#66FCF1] mx-auto mt-2" />
                </motion.div>
            </div>

            {/* Timeline Section */}
            <div className="max-w-5xl mx-auto py-20 px-6 relative">
                {BRAIN_BUILD_HISTORY.map((beat, index) => (
                    <StoryNode
                        key={index}
                        index={index}
                        data={beat} // Pass generic data object
                    />
                ))}

                {/* Footer Message */}
                <div className="text-center mt-32 relative z-10">
                    <div className="inline-block px-8 py-4 bg-[#0B0C10] border border-[#1F2833] rounded-full">
                        <p className="text-gray-400 text-sm">
                            The End is just the Beginning of the next Loop.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
