"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { X, Sparkles, Send, MessageSquare, Lightbulb, FileText, Target } from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

interface AIMascotSceneProps {
    aiReply?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    portfolio?: any
    onClose: () => void
}

// Suggested prompts for empty state
const SUGGESTED_PROMPTS = [
    { icon: FileText, text: "How can I improve my bio?", color: "from-blue-500 to-cyan-500" },
    { icon: Target, text: "What skills should I add?", color: "from-purple-500 to-pink-500" },
    { icon: Lightbulb, text: "Give me project ideas", color: "from-orange-500 to-yellow-500" },
    { icon: MessageSquare, text: "Review my headline", color: "from-green-500 to-emerald-500" },
]

export default function AIMascotScene({ aiReply, portfolio, onClose }: AIMascotSceneProps) {
    const { user } = useUser()
    const [visible, setVisible] = useState(true)
    const [messages, setMessages] = useState<ConversationMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (aiReply) {
            setMessages([{ role: "assistant", content: aiReply }])
        }
    }, [aiReply])

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            })
        }
    }, [messages, loading])

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current && messages.length > 0) {
            inputRef.current.focus()
        }
    }, [messages.length])

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 400)
    }

    const handleSendMessage = async (customMessage?: string) => {
        const messageToSend = customMessage || input.trim()
        if (!messageToSend || loading) return

        const userMessage: ConversationMessage = { role: "user", content: messageToSend }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setLoading(true)
        setIsTyping(true)

        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "portfolio-chat",
                    message: messageToSend,
                    portfolio: portfolio,
                    history: messages,
                }),
            })
            const data = await res.json()
            
            // Simulate typing delay for more natural feel
            await new Promise(resolve => setTimeout(resolve, 300))
            
            const assistantMessage: ConversationMessage = { role: "assistant", content: data.reply }
            setMessages((prev) => [...prev, assistantMessage])
        } catch {
            const errorMessage: ConversationMessage = {
                role: "assistant",
                content: "Oops! Something went wrong. Please try again. 🔄",
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setLoading(false)
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
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
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl h-[85vh] flex flex-col rounded-3xl bg-gradient-to-b from-card to-card/95 shadow-2xl border border-border/30 overflow-hidden"
                    >
                        {/* Animated gradient border top */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1 z-10"
                            style={{
                                background:
                                    "linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 3s linear infinite",
                            }}
                        />

                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-card via-card to-card border-b border-border/30 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="relative w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    <Image src="/Linky_head.png" alt="Linky" width={28} height={28} className="relative z-10" />
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </motion.div>
                                <div>
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        Linky
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                                            Online
                                        </span>
                                    </h2>
                                    <p className="text-xs text-muted-foreground">Your AI Career Advisor</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleClose}
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl h-9 w-9 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Chat Content */}
                        <div
                            ref={chatContainerRef}
                            className="overflow-y-auto flex-grow h-full bg-gradient-to-b from-background/50 to-background/80 p-4 space-y-4"
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(139, 92, 246, 0.3) transparent"
                            }}
                        >
                            {/* Empty State with Suggestions */}
                            {messages.length === 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center h-full py-8"
                                >
                                    <motion.div 
                                        className="w-20 h-20 mb-6 rounded-3xl flex items-center justify-center relative"
                                        style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
                                        animate={{ 
                                            boxShadow: ["0 0 30px rgba(139, 92, 246, 0.3)", "0 0 50px rgba(139, 92, 246, 0.5)", "0 0 30px rgba(139, 92, 246, 0.3)"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Hey there! 👋</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
                                        I&apos;m Linky, your AI career advisor. Ask me anything about improving your portfolio!
                                    </p>
                                    
                                    {/* Suggested Prompts */}
                                    <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4">
                                        {SUGGESTED_PROMPTS.map((prompt, index) => (
                                            <motion.button
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => handleSendMessage(prompt.text)}
                                                className="group flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-purple-500/50 hover:bg-card/80 transition-all duration-200 text-left"
                                            >
                                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${prompt.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                                    <prompt.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                                                    {prompt.text}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Messages */}
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.05 }}
                                    className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
                                >
                                    {msg.role === "assistant" && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1"
                                            style={{
                                                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                                            }}
                                        >
                                            <Image src="/Linky_head.png" alt="Linky" width={20} height={20} />
                                        </motion.div>
                                    )}
                                    <div
                                        className={`relative max-w-[80%] ${
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-lg shadow-purple-500/20"
                                                : "bg-card/90 backdrop-blur-sm border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md"
                                        }`}
                                    >
                                        {msg.role === "user" ? (
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <div className="text-sm prose-sm">
                                                <MarkdownRenderer content={msg.content} />
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1 shadow-md overflow-hidden"
                                        >
                                            {user?.imageUrl ? (
                                                <Image 
                                                    src={user.imageUrl} 
                                                    alt={user.firstName || "You"} 
                                                    width={32} 
                                                    height={32} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                                    <span className="text-white text-[10px] font-bold">
                                                        {user?.firstName?.charAt(0) || "U"}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-end gap-2.5"
                                >
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1"
                                        style={{
                                            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                                        }}
                                    >
                                        <Image src="/Linky_head.png" alt="Linky" width={20} height={20} />
                                    </div>
                                    <div className="bg-card/90 backdrop-blur-sm border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm">
                                        <div className="flex items-center gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 rounded-full bg-purple-500"
                                                    animate={{
                                                        y: [0, -6, 0],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        repeat: Infinity,
                                                        delay: i * 0.15,
                                                    }}
                                                />
                                            ))}
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {isTyping ? "Linky is typing..." : "Thinking..."}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="bg-card/95 backdrop-blur-md border-t border-border/30 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me anything about your portfolio..."
                                        className="w-full bg-background/60 rounded-xl px-4 py-3 text-sm border border-border/40 focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/50 transition-all duration-200 placeholder:text-muted-foreground/50 pr-4"
                                        disabled={loading}
                                    />
                                </div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={() => handleSendMessage()}
                                        disabled={loading || !input.trim()}
                                        size="icon"
                                        className="rounded-xl w-11 h-11 flex-shrink-0 text-white transition-all duration-200 disabled:opacity-40"
                                        style={{
                                            background: loading || !input.trim() 
                                                ? "linear-gradient(135deg, #4b5563, #374151)" 
                                                : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                                            boxShadow: loading || !input.trim() ? "none" : "0 4px 20px rgba(139, 92, 246, 0.4)",
                                        }}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                            </div>
                            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                                Linky can make mistakes. Double-check important advice.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Add the shimmer keyframes to globals.css or include inline
const styles = `
@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
`

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
}
