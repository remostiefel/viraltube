"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, Html, Float } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Activity, Zap, Brain } from "lucide-react";

function NeuralNetwork({ active }: { active: boolean }) {
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 3;
            const y = (Math.random() - 0.5) * 3;
            const z = (Math.random() - 0.5) * 3;
            p.push(new THREE.Vector3(x, y, z));
        }
        return p;
    }, []);

    const lineRef = useRef<any>(null);

    useFrame((state) => {
        if (!lineRef.current) return;
        lineRef.current.rotation.y += 0.002;
        lineRef.current.rotation.x += 0.001;
    });

    return (
        <group>
            <mesh ref={lineRef}>
                {points.map((pos, i) => (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.03, 16, 16]} />
                        <meshStandardMaterial
                            color={active ? "#2DD4BF" : "#555"}
                            emissive={active ? "#2DD4BF" : "#000"}
                            emissiveIntensity={active ? 2 : 0}
                        />
                    </mesh>
                ))}
            </mesh>
        </group>
    );
}

function CortexSphere({ active }: { active: boolean }) {
    const meshRef = useRef<any>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    });

    return (
        <Sphere args={[1.5, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                color={active ? "#000" : "#111"}
                envMapIntensity={0.4}
                clearcoat={1}
                clearcoatRoughness={0}
                metalness={0.9} // Glassy/Metallic
                roughness={0.1}
                distort={0.3}
                speed={1.5}
                wireframe={true} // Sci-Fi Mesh look
                emissive={active ? "#2DD4BF" : "#000"}
                emissiveIntensity={0.1}
            />
        </Sphere>
    );
}

export default function GlassBrain({ state }: { state: "IDLE" | "ACTIVE" | "OPTIMIZED" }) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="w-full h-[400px] relative rounded-3xl overflow-hidden border border-border/20 bg-black/40 shadow-2xl">
            {/* Status Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">System Status</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${state === 'ACTIVE' ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span className={`text-xl font-bold font-mono ${state === 'ACTIVE' ? 'text-teal-400' : 'text-slate-400'}`}>
                            {state === 'ACTIVE' ? 'GAMMA_SYNC' : state === 'OPTIMIZED' ? 'FLOW_STATE' : 'STANDBY'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 pointer-events-none text-right">
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Neural Load</span>
                    <span className="text-sm font-mono text-primary">
                        {state === 'ACTIVE' ? '84%' : '12%'}
                    </span>
                </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end pointer-events-none">
                <div className="flex gap-4">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-teal-500/20">
                        <div className="text-[10px] text-teal-500 uppercase font-bold mb-1">Dopamine</div>
                        <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 w-[70%]" />
                        </div>
                    </div>
                    <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-red-500/20">
                        <div className="text-[10px] text-red-500 uppercase font-bold mb-1">Cortisol</div>
                        <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[20%]" />
                        </div>
                    </div>
                </div>
            </div>

            <Canvas camera={{ position: [0, 0, 4.5] }} className="touch-none">
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#2DD4BF" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A855F7" />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <CortexSphere active={state === 'ACTIVE'} />
                    <NeuralNetwork active={state === 'ACTIVE'} />
                </Float>

                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    )
}
