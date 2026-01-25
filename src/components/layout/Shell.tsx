"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/auth";
import { Persona } from "@/components/assistant/Persona";
import { DeviceFrame } from "@/components/layout/DeviceFrame";
import { Smartphone, Monitor, Menu, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";
    const [isMobileMode, setIsMobileMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <AuthProvider>
            <div className="flex h-screen bg-background text-foreground overflow-hidden">
                {!isMobileMode && !isLoginPage && <Sidebar />}

                <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all ${!isLoginPage && !isMobileMode ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background" : "bg-black"}`}>

                    {!isLoginPage && !isMobileMode && <Header />}

                    <main className={`flex-1 overflow-hidden relative ${!isLoginPage && !isMobileMode ? "p-8 z-0 overflow-y-auto" : ""}`}>
                        {!isLoginPage && !isMobileMode && (
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-[-1]" />
                        )}

                        <DeviceFrame active={isMobileMode}>
                            {isMobileMode ? (
                                <div className="flex h-full bg-background/5 relative overflow-hidden">

                                    {/* Mobile Hamburger Trigger */}
                                    <div className="absolute top-4 left-4 z-30">
                                        <button
                                            onClick={() => setMobileMenuOpen(true)}
                                            className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 shadow-xl hover:bg-black/80 transition-all"
                                        >
                                            <Menu className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Mobile Content Area */}
                                    <div className="flex-1 overflow-y-auto relative scrollbar-hide pt-16">
                                        <div className="px-2 pb-20">
                                            {children}
                                        </div>
                                    </div>

                                    {/* Mobile Menu Drawer */}
                                    {mobileMenuOpen && (
                                        <div className="absolute inset-0 z-50 flex">
                                            {/* Backdrop */}
                                            <div
                                                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                                                onClick={() => setMobileMenuOpen(false)}
                                            />

                                            {/* Sidebar Content */}
                                            <div className="relative w-64 h-full bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300">
                                                {/* Allow clicking Sidebar without closing */}
                                                <div className="h-full" onClick={(e) => {
                                                    // Close on link click? Sidebar links don't emit close yet.
                                                    // For now just standard sidebar.
                                                    e.stopPropagation();
                                                }}>
                                                    <Sidebar isMobile={false} />
                                                </div>

                                                {/* Close Button */}
                                                <button
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="absolute top-2 right-[-45px] p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                children
                            )}
                        </DeviceFrame>
                    </main>

                    {/* Global PERSONA (Team Lead) */}
                    {!isLoginPage && !isMobileMode && <Persona />}

                    {/* Mobile Toggle Trigger - Floating */}
                    {!isLoginPage && (
                        <div className="absolute bottom-6 right-6 z-50">
                            <Tooltip content={isMobileMode ? "Switch to Desktop Mode" : "Switch to Mobile Capture Mode"} side="left">
                                <button
                                    onClick={() => setIsMobileMode(!isMobileMode)}
                                    className={`
                                        p-4 rounded-full shadow-2xl transition-all duration-300 border
                                        ${isMobileMode
                                            ? "bg-white text-black border-white hover:scale-110"
                                            : "bg-black/50 backdrop-blur-md text-white border-white/10 hover:bg-black/80"
                                        }
                                    `}
                                >
                                    {isMobileMode ? <Monitor className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </AuthProvider>
    );
}
