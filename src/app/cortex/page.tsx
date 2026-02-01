import { CortexSidebar } from "@/components/cortex/CortexSidebar";
import MindMapWrapper from "@/components/cortex/MindMap";
import { Map } from "lucide-react";

export default function CortexPage() {
    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Simple Header */}
            <header className="h-14 border-b border-border/20 flex items-center px-6 bg-black/40 backdrop-blur-sm z-10">
                <Map className="w-6 h-6 text-cyan-400 mr-2" />
                <h1 className="text-lg font-bold tracking-widest text-white uppercase">Knowledge Canvas</h1>
                <span className="ml-4 text-xs text-muted-foreground font-mono">NEURAL_GRAPH_V1</span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <CortexSidebar />
                <div className="flex-1 relative">
                    <MindMapWrapper />
                </div>
            </div>
        </div>
    );
}
