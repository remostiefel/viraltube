"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: string;
    name: string;
    role: "operator" | "admin";
    clearanceLevel: number;
}

interface AuthContextType {
    user: User | null;
    login: (code: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER: User = {
    id: "op-001",
    name: "Lead Operator",
    role: "operator",
    clearanceLevel: 5
};

const ACCESS_CODE = "NEURO";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for session
        const stored = localStorage.getItem("nc_session");
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Guard Routes
        if (!isLoading) {
            if (!user && pathname !== "/login") {
                router.push("/login");
            } else if (user && pathname === "/login") {
                router.push("/");
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = async (code: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        if (code.toUpperCase() === ACCESS_CODE) {
            setUser(FAKE_USER);
            localStorage.setItem("nc_session", JSON.stringify(FAKE_USER));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("nc_session");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
