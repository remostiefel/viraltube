"use client";

import { cn } from "@/lib/utils";
import { Smartphone } from "lucide-react";

interface DeviceFrameProps {
    children: React.ReactNode;
    active: boolean;
}

export function DeviceFrame({ children, active }: DeviceFrameProps) {
    if (!active) return <>{children}</>;

    return (
        <div className="flex justify-center items-center w-full h-full bg-black/90 p-8 overflow-hidden">
            {/* Simulation Container */}
            <div className="relative w-[400px] h-[850px] bg-background border-[10px] border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col ring-8 ring-gray-900/50">

                {/* Dynamic Island / Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black/50 z-50 rounded-b-xl backdrop-blur-md flex items-center justify-center">
                    <div className="w-[80px] h-4 bg-black rounded-full" />
                </div>

                {/* Status Bar Fake */}
                <div className="h-12 w-full bg-background/50 backdrop-blur-sm z-40 shrink-0 flex items-center justify-between px-6 pt-2">
                    <span className="text-[10px] font-mono font-bold">9:41</span>
                    <div className="flex gap-1">
                        <Smartphone className="w-3 h-3" />
                        <span className="text-[10px] font-mono font-bold">5G</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative bg-background">
                    {children}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[140px] h-1 bg-foreground/20 rounded-full z-50" />
            </div>

            <div className="absolute bottom-8 text-white/40 text-xs font-mono uppercase tracking-widest text-center">
                Mobile Capture Mode [9:16]
            </div>
        </div>
    );
}
