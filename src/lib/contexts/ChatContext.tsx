"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Message = {
    role: "user" | "bot";
    content: string;
};

export type UseChatReturn = {
    messages: Message[];
    isOnline: boolean;
    isLoading: boolean;
    isSending: boolean;
    sendMessage: (msg: string) => Promise<void>;
    clearHistory: () => void;
}

const ChatContext = createContext<UseChatReturn | undefined>(undefined);

const STORAGE_KEY = "chat_history";

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load check
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Load history on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save history whenever messages change, BUT ONLY after initialization
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages, isInitialized]);

    // Check connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            // Don't set global loading here to avoid blocking UI if history is loaded
            // Just check status quietly or setup an interval?
            // Original code blocked UI with isLoading. Let's keep a separate 'isCheckingConnection' or just use isLoading carefully.
            // The original UI uses isLoading to show a backdrop. We might want to separate 'loading history' from 'checking connection'.
            // For now, let's keep it simple.

            try {
                const res = await fetch("/api/chat");
                if (res.ok) {
                    setIsOnline(true);
                } else {
                    setIsOnline(false);
                }
            } catch (error) {
                console.error("Connection check failed", error);
                setIsOnline(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkConnection();
    }, []);

    const sendMessage = useCallback(
        async (msg: string) => {
            if (!msg.trim() || isSending) return;

            const newMessage: Message = { role: "user", content: msg };

            // Optimistic update
            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            setIsSending(true);

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: msg,
                        chat_history: messages.map((m) => ({
                            role: m.role === "user" ? "user" : "assistant",
                            content: m.content,
                        })),
                    }),
                });

                if (!res.ok) {
                    throw new Error("Failed to send message");
                }

                const data = await res.json();

                const botResponse: Message = {
                    role: "bot",
                    content: data.response || (data.data && data.data.response) || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
                };

                setMessages((prev) => [...prev, botResponse]);
            } catch (error) {
                console.error("SendMessage error", error);
                // Could revert optimistic update here if desired
            } finally {
                setIsSending(false);
            }
        },
        [messages, isSending]
    );

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                messages,
                isOnline,
                isLoading,
                isSending,
                sendMessage,
                clearHistory,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};
