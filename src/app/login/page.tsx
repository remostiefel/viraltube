"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Brain, Lock, ScanLine, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const { login } = useAuth();
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setStatus("scanning");
        const success = await login(code);

        if (success) {
            setStatus("success");
            // AuthContext will handle redirect
        } else {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden relative group">

                    {/* Scanning Bar Animation */}
                    <div className={cn(
                        "absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(var(--primary))] transition-all duration-1000",
                        status === "scanning" ? "translate-y-[400px]" : "translate-y-0 opacity-0"
                    )} />

                    <div className="p-8 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20 group-hover:ring-primary/50 transition-all">
                                <Brain className="w-12 h-12 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tighter">
                                NEURO<span className="text-muted-foreground">-CODE</span>
                            </h1>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
                                Secure Access Terminal
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Access Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="ENTER KEY_CODE"
                                        className="w-full bg-muted/30 border border-border rounded-xl px-10 py-3 font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase placeholder:normal-case placeholder:tracking-normal"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === "scanning" || status === "success"}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                                    status === "error" ? "bg-red-500/10 text-red-500 border border-red-500/50" :
                                        status === "success" ? "bg-green-500 text-white" :
                                            "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25"
                                )}
                            >
                                {status === "idle" && <>Unlocks System <ArrowRight className="w-4 h-4" /></>}
                                {status === "scanning" && <><ScanLine className="w-4 h-4 animate-pulse" /> Verifying...</>}
                                {status === "success" && <><ShieldCheck className="w-4 h-4" /> Access Granted</>}
                                {status === "error" && <><AlertCircle className="w-4 h-4" /> Access Denied</>}
                            </button>
                        </form>

                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground/50 font-mono">
                                SYSTEM v3.0 // PROPRIETARY ALGORITHMS
                                <br />
                                UNATHORIZED ACCESS LOGGED
                            </p>
                            <p className="mt-2 text-[10px] text-primary/50 cursor-pointer hover:text-primary transition-colors hover:underline" onClick={() => setCode("NEURO")}>
                                (Hint: Key is NEURO)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
