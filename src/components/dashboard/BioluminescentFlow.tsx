"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Cloud } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function FlowParticles({ speed = 0.5, color = "#A855F7" }) {
    return (
        <Sparkles
            count={200}
            scale={10}
            size={4}
            speed={speed}
            opacity={0.5}
            color={color}
        />
    );
}

function Nebula({ color }: { color: string }) {
    const ref = useRef<any>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <group ref={ref}>
            <Cloud opacity={0.3} speed={0.4} width={10} depth={1.5} segments={20} color={color} />
        </group>
    )
}

export default function BioluminescentFlow({
    active,
    frequency = "ALPHA"
}: {
    active: boolean;
    frequency: string
}) {
    const getColor = (freq: string) => {
        switch (freq) {
            case "THETA": return "#2DD4BF"; // Teal for hypnosis/creativity
            case "GAMMA": return "#FACC15"; // Gold for insight
            case "ALPHA": default: return "#A855F7"; // Purple for flow
        }
    };

    const color = getColor(frequency);

    return (
        <div className="w-full h-full absolute inset-0 bg-black/80">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color={color} />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    {active && <Nebula color={color} />}
                    <FlowParticles speed={active ? 0.8 : 0.2} color={color} />
                </Float>

                <fog attach="fog" args={['#000', 3, 15]} />
            </Canvas>
        </div>
    )
}
