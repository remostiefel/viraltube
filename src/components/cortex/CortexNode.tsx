import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Youtube, Lightbulb, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CortexNodeData } from '@/lib/cortex-data';

const CortexNode = ({ data, selected }: NodeProps & { data: CortexNodeData }) => {
    // Determine look based on type
    const isVideo = data.type === 'video';
    const isWisdom = data.type === 'wisdom';
    const isSpark = data.type === 'spark';

    return (
        <div className={cn(
            "min-w-[200px] max-w-[300px] rounded-xl border-2 transition-all shadow-2xl backdrop-blur-md",
            selected ? "border-white scale-105 z-50 ring-2 ring-blue-500/50" : "border-transparent",
            isVideo ? "bg-red-950/80 border-red-500/20" :
                isWisdom ? "bg-purple-950/80 border-purple-500/20" :
                    "bg-yellow-950/80 border-yellow-500/20"
        )}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="!bg-white !w-3 !h-3" />

            {/* Header */}
            <div className={cn(
                "px-3 py-2 border-b flex items-center gap-2",
                isVideo ? "border-red-500/20 bg-red-500/10" :
                    isWisdom ? "border-purple-500/20 bg-purple-500/10" :
                        "border-yellow-500/20 bg-yellow-500/10"
            )}>
                {isVideo && <Youtube className="w-4 h-4 text-red-500" />}
                {isWisdom && <Lightbulb className="w-4 h-4 text-purple-400" />}
                {isSpark && <Sparkles className="w-4 h-4 text-yellow-400" />}

                <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    isVideo ? "text-red-400" : isWisdom ? "text-purple-300" : "text-yellow-300"
                )}>
                    {isVideo ? "Video Source" : isWisdom ? "Wisdom Nugget" : "Creative Spark"}
                </span>
            </div>

            {/* Content */}
            <div className="p-3">
                {data.thumbnail && (
                    <div className="w-full h-24 mb-2 rounded bg-black overflow-hidden relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}

                <div className="font-bold text-sm text-white leading-tight mb-1">
                    {data.label}
                </div>

                {data.description && (
                    <div className="text-[10px] text-white/60 line-clamp-3 font-mono mt-2 bg-black/20 p-2 rounded">
                        {data.description}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3" />
        </div>
    );
};

export default memo(CortexNode);
