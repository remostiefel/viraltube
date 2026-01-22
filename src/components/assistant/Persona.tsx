"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { processChat } from "@/app/actions";
import { ChatMessage } from "@/lib/gemini";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Persona() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: "user", parts: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Inject context about current location
            const contextMsg = `[Context: User is currently on page "${pathname}"]\n${userMsg.parts}`;

            const response = await processChat(messages, contextMsg);

            setMessages(prev => [...prev, { role: "model", parts: response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", parts: "I seem to be having trouble connecting to the Neural Network. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Parser for Action Links: [ACTION: Label | Path]
    const renderMessageContent = (text: string) => {
        const parts = text.split(/(\[ACTION:.*?\])/g);

        return parts.map((part, idx) => {
            if (part.startsWith("[ACTION:")) {
                const content = part.replace("[ACTION:", "").replace("]", "").trim();
                const [label, path] = content.split("|").map(s => s.trim());

                if (label && path) {
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                router.push(path);
                                setIsOpen(false); // Optional: close chat or keep open? promoting flow vs persistent help. Let's keep open for now or user can close. Actually, navigating usually means context switch. Let's keep it open so they see the guide.
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 my-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors border border-primary/20"
                        >
                            {label} <ArrowRight className="w-3 h-3" />
                        </button>
                    );
                }
            }
            return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group",
                    isOpen
                        ? "bg-muted text-muted-foreground rotate-90"
                        : "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-950 hover:to-yellow-300 border-2 border-yellow-200/50 shadow-lg shadow-yellow-500/20"
                )}
                title="Open PERSONA"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] z-50 transition-all duration-300 origin-bottom-right",
                    "bg-[#F3F4F6]/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl flex flex-col overflow-hidden",
                    "text-gray-800 font-sans",
                    isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none translate-y-4"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 bg-white/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-white flex items-center justify-center shadow-sm border border-white">
                            <Bot className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm tracking-wide">PERSONA</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Team Lead Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-10 px-6 animate-in fade-in duration-700">
                            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm relative">
                                <Sparkles className="w-8 h-8 text-gray-400" />
                                <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center border border-white">
                                    <span className="text-[10px] font-bold text-green-600">20</span>
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-700 mb-2">Team Ready.</h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-6">
                                I am PERSONA, your Creative Director. The entire virtual team (Data, Writing, Art) is standing by.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => { setInput("What is our best strategic move right now?"); }}
                                    className="text-xs bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 text-left transition-all hover:translate-x-1 shadow-sm"
                                >
                                    🚀 <strong>Strategy Check:</strong> What's our next move?
                                </button>
                                <button
                                    onClick={() => { setInput("Ask the Data Team for a viral opportunity."); }}
                                    className="text-xs bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 text-left transition-all hover:translate-x-1 shadow-sm"
                                >
                                    📊 <strong>Data Team:</strong> Find a viral opportunity.
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            <div
                                className={cn(
                                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    msg.role === "user"
                                        ? "bg-white text-gray-900 rounded-br-none ml-8"
                                        : "bg-white/80 text-gray-800 rounded-bl-none border border-white/50 mr-8"
                                )}
                            >
                                <div className="leading-relaxed">
                                    {msg.role === "model" ? renderMessageContent(msg.parts) : <div className="whitespace-pre-wrap">{msg.parts}</div>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/50 px-4 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs font-medium text-gray-500">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                                Consulting Team...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 bg-white border-t border-gray-100">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Direct the team..."
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-medium"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg shadow-gray-200"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
