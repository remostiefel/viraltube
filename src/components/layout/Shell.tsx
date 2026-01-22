"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/auth";
import { Persona } from "@/components/assistant/Persona";

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <AuthProvider>
            {!isLoginPage && <Sidebar />}
            <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${!isLoginPage ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background" : ""}`}>
                {!isLoginPage && <Header />}
                <main className={`flex-1 overflow-y-auto ${!isLoginPage ? "p-8 relative z-0" : ""}`}>
                    {!isLoginPage && (
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-[-1]" />
                    )}
                    {children}
                </main>

                {/* Global PERSONA (Team Lead) */}
                {!isLoginPage && <Persona />}
            </div>
        </AuthProvider>
    );
}
