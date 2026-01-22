"use client";

import { useMemo } from "react";
import { Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, CartesianGrid, ReferenceLine } from "recharts";
import { PacingDataPoint } from "@/lib/pacing";
import { Activity, Zap } from "lucide-react";

interface RetentionGraphProps {
    data: PacingDataPoint[];
}

export function RetentionGraph({ data }: RetentionGraphProps) {
    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload as PacingDataPoint;
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold mb-1">{point.timestamp} - {point.sectionName}</p>
                    <div className="space-y-1">
                        <p className="text-yellow-500 font-mono">Visual Density: {point.visualDensity}</p>
                        <p className="text-red-400 font-mono">Tension: {point.tension}</p>
                        <p className="text-green-400 font-mono">Reward: {point.reward}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card/50 border border-border/40 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-yellow-500" />
                    Retention Architect (Pacing)
                </h3>
                <div className="flex gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full" /> Visual Heartbeat</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/50 rounded-full" /> Tension</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500/50 rounded-full" /> Reward</span>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTension" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="timestamp"
                            tick={{ fontSize: 10, fill: '#666' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Areas usually behind lines */}
                        <Area type="monotone" dataKey="tension" stroke="#ef4444" strokeWidth={0} fillOpacity={1} fill="url(#colorTension)" />
                        <Area type="monotone" dataKey="reward" stroke="#22c55e" strokeWidth={0} fillOpacity={1} fill="url(#colorReward)" />

                        {/* The Heartbeat Line */}
                        <Line type="stepAfter" dataKey="visualDensity" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground italic text-center">
                Review sections where lines flatten out (low density) or Neuro-Engagement drops.
            </p>
        </div>
    );
}
