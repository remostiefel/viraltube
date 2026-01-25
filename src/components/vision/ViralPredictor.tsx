"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, XAxis } from "recharts";

const MOCK_DATA = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: 10 + Math.random() * 20 + i * 2, // Upward trend
    dopamine: 20 + Math.random() * 30 + i * 3,
    adrenaline: 5 + Math.random() * 10 + i,
}));

export default function ViralPredictor() {
    const [data, setData] = useState<any[]>(MOCK_DATA.slice(0, 5));

    useEffect(() => {
        const interval = setInterval(() => {
            setData(current => {
                if (current.length >= MOCK_DATA.length) return MOCK_DATA.slice(0, 5); // Reset
                return MOCK_DATA.slice(0, current.length + 1);
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl overflow-hidden flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#F472B6] text-xs font-mono uppercase tracking-widest">
                    Viral Prediction Model
                </h3>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#F472B6]" />
                        <span className="text-[10px] text-gray-400">Dopamine</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                        <span className="text-[10px] text-gray-400">Adrenaline</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorDopamine" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F472B6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorAdrenaline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#1F2833', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="dopamine"
                            stroke="#F472B6"
                            fillOpacity={1}
                            fill="url(#colorDopamine)"
                            isAnimationActive={true}
                        />
                        <Area
                            type="monotone"
                            dataKey="adrenaline"
                            stroke="#38BDF8"
                            fillOpacity={1}
                            fill="url(#colorAdrenaline)"
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>


            </div>
        </div>
    );
}
