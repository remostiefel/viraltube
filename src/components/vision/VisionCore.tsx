"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Image, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

export type CoreMode = 'idle' | 'simulating' | 'dopamine' | 'storm' | 'godmode' | 'scripting' | 'editing' | 'ab_testing';

const MODE_CONFIG = {
    idle: { color: "#45A29E", speed: 2, distort: 0.4, scale: 1.5, text: "NEURO-ENGINE ACTIVE" },
    simulating: { color: "#A855F7", speed: 4, distort: 0.6, scale: 1.8, text: "PROCESSING STREAM..." },
    dopamine: { color: "#4ADE80", speed: 8, distort: 0.8, scale: 2.2, text: "DOPAMINE INJECTION" },
    storm: { color: "#F472B6", speed: 12, distort: 1.2, scale: 1.6, text: "VIRAL STORM DETECTED" },
    godmode: { color: "#FFFFFF", speed: 1, distort: 0.2, scale: 2.5, text: "GOD MODE: RENDERING" },
    scripting: { color: "#38BDF8", speed: 3, distort: 0.5, scale: 1.9, text: "NEURO-SCRIPTING" }, // Cyan
    editing: { color: "#F97316", speed: 10, distort: 1.0, scale: 2.0, text: "QUANTUM EDITING" }, // Orange
    ab_testing: { color: "#FACC15", speed: 6, distort: 0.7, scale: 1.9, text: "NEURO-A/B LAB" }, // Yellow
};

function AnimatedSphere({ mode }: { mode: CoreMode }) {
    const meshRef = useRef<any>(null);
    const config = MODE_CONFIG[mode];

    useFrame((state) => {
        if (!meshRef.current) return;
        const targetScale = config.scale + Math.sin(state.clock.elapsedTime * (mode === 'storm' ? 8 : 2)) * 0.1;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Rotate faster in active modes
        meshRef.current.rotation.y += mode === 'storm' ? 0.05 : 0.01;
    });

    return (
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                color={config.color}
                attach="material"
                distort={config.distort}
                speed={config.speed}
                roughness={mode === 'godmode' ? 0.1 : 0.2}
                metalness={mode === 'godmode' ? 1 : 0.8}
                transparent
                opacity={0.9}
            />
        </Sphere>
    );
}

function Connections({ count = 20, mode }: { count?: number, mode: CoreMode }) {
    const config = MODE_CONFIG[mode];
    const lines = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            return {
                start: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2] as [number, number, number],
                end: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2] as [number, number, number],
            }
        })
    }, [count]);

    return (
        <group>
            {lines.map((line, i) => (
                <Line key={i} start={line.start} end={line.end} color={config.color} />
            ))}
        </group>
    )
}

function Line({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
    const ref = useRef<any>(null!);

    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    const material = useMemo(() => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }), [color]);

    useFrame((state) => {
        if (ref.current) {
            ref.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
            ref.current.material.color.set(color);
        }
    });

    return (
        <primitive object={new THREE.Line(lineGeometry, material)} ref={ref} />
    )
}

function AnimatedCore({ active, godMode }: { active: boolean; godMode: boolean }) {
    const meshRef = useRef<any>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Pulse effect
        const t = state.clock.getElapsedTime();
        const baseScale = godMode ? 2.5 : 2;
        const pulseSpeed = godMode ? 5 : 3;

        const scale = active ? baseScale + Math.sin(t * pulseSpeed) * (godMode ? 0.3 : 0.2) : 1.8 + Math.sin(t) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);

        // Rotation
        meshRef.current.rotation.y += active ? (godMode ? 0.05 : 0.02) : 0.005;
    });

    return (
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                color={active ? (godMode ? "#FACC15" : "#A855F7") : "#4B5563"}
                attach="material"
                distort={active ? (godMode ? 0.8 : 0.6) : 0.3}
                speed={active ? (godMode ? 6 : 4) : 1.5}
                roughness={godMode ? 0.1 : 0.2}
                metalness={godMode ? 1 : 0.8}
            />
        </Sphere>
    );
}

export default function VisionCore({ active, godMode = false, mode = 'idle' }: { active: boolean; godMode?: boolean; mode?: CoreMode }) {
    const config = MODE_CONFIG[mode]; // Kept for the text overlay, though 'mode' is not used for the 3D scene anymore.

    return (
        <div className={`w-full h-[400px] relative rounded-3xl overflow-hidden border transition-colors duration-500 ${godMode ? "border-yellow-500/50 bg-yellow-900/10" : "border-border/30 bg-black/40"}`}>
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color={godMode ? "#FACC15" : "#A855F7"} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38BDF8" />

                    <Float speed={godMode ? 4 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <AnimatedCore active={active} godMode={godMode} />
                    </Float>

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={godMode ? 2 : 1} />
                </Canvas>
            </div>

            {/* Overlay UI */}
            <div className={`absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md border transition-all duration-500 ${active ? (godMode ? "bg-yellow-500/10 border-yellow-500/50" : "bg-purple-500/10 border-purple-500/50") : "bg-black/40 border-white/10"}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Core Status</div>
                        <div className={`text-lg font-bold font-mono ${active ? (godMode ? "text-yellow-400 animate-pulse" : "text-purple-400 animate-pulse") : "text-gray-400"}`}>
                            {active ? (godMode ? "GOD MODE: GENIUS EXTRACTION" : "PROCESSING NEURAL DATA...") : "STANDBY"}
                        </div>
                    </div>
                    {active && (
                        <div className={`h-2 w-2 rounded-full animate-ping ${godMode ? "bg-yellow-500" : "bg-red-500"}`} />
                    )}
                </div>
            </div>

            {/* Dynamic Text Overlay */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full text-center">
                <motion.div
                    key={mode} // Animate when mode changes
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.5 }}
                >
                    <h2
                        className="text-4xl font-bold tracking-widest z-10 font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        style={{ color: config.color === '#FFFFFF' ? '#000' : config.color, textShadow: `0 0 20px ${config.color}` }}
                    >
                        {mode === 'godmode' ? 'GOD MODE' : 'VIRT VISION'}
                    </h2>
                    <div className="text-sm font-mono mt-2 tracking-[0.3em] font-bold text-white/80 animate-pulse">
                        [{config.text}]
                    </div>
                </motion.div>
            </div>

            {/* Status Indicator Bottom Right */}
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-500">
                CORE_TEMP: {mode === 'storm' ? 'CRITICAL' : 'OPTIMAL'}
            </div>
        </div>
    );
}
