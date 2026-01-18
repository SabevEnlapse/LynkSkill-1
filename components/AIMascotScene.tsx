"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { X, Sparkles, Send } from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { Input } from "@/components/ui/input"
import { Portfolio } from "@/app/types"

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

interface AIMascotSceneProps {
    aiReply?: string
    portfolio?: Portfolio
    onClose: () => void
}

export default function AIMascotScene({ aiReply, portfolio, onClose }: AIMascotSceneProps) {
    const [visible, setVisible] = useState(true)
    const [messages, setMessages] = useState<ConversationMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (aiReply) {
            setMessages([{ role: "assistant", content: aiReply }])
        }
    }, [aiReply])

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 400)
    }

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage: ConversationMessage = { role: "user", content: input }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "portfolio-chat",
                    message: input,
                    portfolio: portfolio,
                    history: messages,
                }),
            })
            const data = await res.json()
            const assistantMessage: ConversationMessage = { role: "assistant", content: data.reply }
            setMessages((prev) => [...prev, assistantMessage])
        } catch {
            const errorMessage: ConversationMessage = {
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        document.body.style.overflow = visible ? "hidden" : "auto"
        return () => {
            document.body.style.overflow = "auto"
        }
    }, [visible])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl h-[90vh] flex flex-col rounded-3xl bg-card shadow-2xl border border-border/50"
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{
                                background:
                                    "linear-gradient(90deg, var(--portfolio-hero-from), var(--portfolio-hero-to), var(--portfolio-hero-from))",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 3s linear infinite",
                            }}
                        />

                        {/* Header */}
                        <div className="relative bg-card border-b border-border/50 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center relative"
                                    style={{
                                        background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                        boxShadow: "0 0 20px rgba(100, 80, 255, 0.3)",
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Chat with Linky</h2>
                                    <p className="text-xs text-muted-foreground">Powered by Linky</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleClose}
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-9 w-9"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div
                            ref={chatContainerRef}
                            className="overflow-y-auto flex-grow h-full max-h-[calc(90vh-160px)] bg-gradient-to-b from-background/95 to-background p-4 md:p-6 space-y-4"
                        >
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))" }}>
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Welcome to AI Chat!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Ask me anything about your portfolio.</p>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                    className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-500/20"
                                            style={{
                                                background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                            }}
                                        >
                                            <Image src="/Linky_head.png" alt="Linky" width={22} height={22} />
                                        </div>
                                    )}
                                    <div
                                        className={`relative max-w-[85%] md:max-w-[75%] ${
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-lg shadow-purple-500/20"
                                                : "bg-card/80 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-md"
                                        }`}
                                    >
                                        {msg.role === "user" ? (
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <div className="text-sm">
                                                <MarkdownRenderer content={msg.content} />
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <span className="text-white text-xs font-semibold">You</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-500/20"
                                        style={{
                                            background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                        }}
                                    >
                                        <Image src="/Linky_head.png" alt="Linky" width={22} height={22} />
                                    </div>
                                    <div className="bg-card/80 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-md">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="w-2 h-2 rounded-full animate-bounce"
                                                style={{
                                                    backgroundColor: "var(--portfolio-hero-from)",
                                                    animationDelay: "0ms",
                                                }}
                                            />
                                            <div
                                                className="w-2 h-2 rounded-full animate-bounce"
                                                style={{
                                                    backgroundColor: "var(--portfolio-hero-to)",
                                                    animationDelay: "150ms",
                                                }}
                                            />
                                            <div
                                                className="w-2 h-2 rounded-full animate-bounce"
                                                style={{
                                                    backgroundColor: "var(--portfolio-hero-from)",
                                                    animationDelay: "300ms",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer with Input */}
                        <div className="bg-card/95 backdrop-blur-md border-t border-border/50 px-4 md:px-6 py-4">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="flex-1 relative">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Ask a follow-up question..."
                                        className="w-full bg-background/80 rounded-xl px-4 py-3 text-sm border border-border/50 focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 transition-all duration-200 placeholder:text-muted-foreground/60"
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={loading || !input.trim()}
                                    size="icon"
                                    className="rounded-xl w-11 h-11 flex-shrink-0 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                    style={{
                                        background: loading || !input.trim() 
                                            ? "linear-gradient(135deg, #6b7280, #4b5563)" 
                                            : "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                        boxShadow: loading || !input.trim() ? "none" : "0 4px 15px rgba(100, 80, 255, 0.3)",
                                    }}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
;<style jsx global>{`
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`}</style>
