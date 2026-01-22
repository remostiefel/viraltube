"use client";

import { Activity, Flame, Heart, Info } from "lucide-react";

interface PEOScore {
    dopamine: { score: number; logic: string };
    cortisol: { score: number; logic: string };
    oxytocin: { score: number; logic: string };
}

interface NeuroScoreProps {
    score: PEOScore;
}

export function NeuroScore({ score }: NeuroScoreProps) {
    return (
        <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Neuro-Scoring (P.E.O.)
            </h3>

            <div className="space-y-6">
                {/* Dopamine */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-green-500 flex items-center gap-2">
                            <Flame className="w-4 h-4" /> Dopamine (Reward)
                        </span>
                        <span className="font-mono text-green-500">{score.dopamine.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${score.dopamine.score}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground italic">{score.dopamine.logic}</p>
                </div>

                {/* Cortisol */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-red-500 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Cortisol (Tension)
                        </span>
                        <span className="font-mono text-red-500">{score.cortisol.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${score.cortisol.score}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground italic">{score.cortisol.logic}</p>
                </div>

                {/* Oxytocin */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-blue-500 flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Oxytocin (Trust)
                        </span>
                        <span className="font-mono text-blue-500">{score.oxytocin.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${score.oxytocin.score}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground italic">{score.oxytocin.logic}</p>
                </div>
            </div>
        </div>
    );
}
