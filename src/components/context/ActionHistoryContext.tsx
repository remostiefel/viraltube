"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface TravelAction {
    id: string;
    description: string;
    path: string;
    do: () => Promise<void>;
    undo: () => Promise<void>;
}

interface ActionHistoryContextType {
    undoStack: TravelAction[];
    redoStack: TravelAction[];
    register: (action: Omit<TravelAction, "id" | "path">) => void;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canUndo: boolean;
    canRedo: boolean;
}

const ActionHistoryContext = createContext<ActionHistoryContextType | undefined>(undefined);

export function ActionHistoryProvider({ children }: { children: ReactNode }) {
    const [undoStack, setUndoStack] = useState<TravelAction[]>([]);
    const [redoStack, setRedoStack] = useState<TravelAction[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    const register = useCallback((actionParts: Omit<TravelAction, "id" | "path">) => {
        const action: TravelAction = {
            id: crypto.randomUUID(),
            path: pathname, // Capture the screen where action happened
            ...actionParts
        };

        setUndoStack(prev => [...prev, action]);
        setRedoStack([]); // Clear redo stack on new action
    }, [pathname]);

    const undo = useCallback(async () => {
        if (undoStack.length === 0) return;

        const actionToUndo = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);

        // Auto-Navigate back to the scene of the crime
        if (actionToUndo.path && actionToUndo.path !== pathname) {
            router.push(actionToUndo.path);
        }

        try {
            await actionToUndo.undo();
            setUndoStack(newUndoStack);
            setRedoStack(prev => [actionToUndo, ...prev]);
        } catch (error) {
            console.error("Undo failed:", error);
            // In a robust system, we might reload settings or alert user.
        }
    }, [undoStack, pathname, router]);

    const redo = useCallback(async () => {
        if (redoStack.length === 0) return;

        const actionToRedo = redoStack[0];
        const newRedoStack = redoStack.slice(1);

        // Auto-Navigate
        if (actionToRedo.path && actionToRedo.path !== pathname) {
            router.push(actionToRedo.path);
        }

        try {
            await actionToRedo.do();
            setRedoStack(newRedoStack);
            setUndoStack(prev => [...prev, actionToRedo]);
        } catch (error) {
            console.error("Redo failed:", error);
        }
    }, [redoStack, pathname, router]);

    return (
        <ActionHistoryContext.Provider value={{
            undoStack,
            redoStack,
            register,
            undo,
            redo,
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0
        }}>
            {children}
        </ActionHistoryContext.Provider>
    );
}

export function useActionHistory() {
    const context = useContext(ActionHistoryContext);
    if (context === undefined) {
        throw new Error("useActionHistory must be used within an ActionHistoryProvider");
    }
    return context;
}
