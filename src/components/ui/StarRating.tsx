"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    value: number; // 0-5
    onChange: (value: number) => void;
    editable?: boolean;
    size?: number;
}

export function StarRating({ value, onChange, editable = true, size = 16 }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue !== null ? hoverValue : value;

    return (
        <div
            className="flex items-center gap-0.5"
            onMouseLeave={() => setHoverValue(null)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (editable) onChange(star);
                    }}
                    onMouseEnter={() => editable && setHoverValue(star)}
                    className={cn(
                        "transition-all duration-200 focus:outline-none",
                        editable ? "cursor-pointer hover:scale-110" : "cursor-default"
                    )}
                    disabled={!editable}
                >
                    <Star
                        size={size}
                        className={cn(
                            "transition-colors",
                            star <= displayValue
                                ? "fill-cyan-400 text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]"
                                : "fill-none text-muted-foreground/30 hover:text-cyan-400/50"
                        )}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
}
