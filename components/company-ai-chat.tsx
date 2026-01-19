"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Send, 
    Sparkles, 
    Building2, 
    Bot, 
    Loader2, 
    User,
    Target,
    RefreshCw,
    Search,
    Zap,
    Users,
    Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAIMode } from "@/lib/ai-mode-context"
import { cn } from "@/lib/utils"

export function CompanyAIChat() {
    const { 
        messages, 
        addMessage, 
        isLoading, 
        setIsLoading, 
        studentMatches, 
        setStudentMatches,
        chatPhase,
        setChatPhase,
        clearMessages
    } = useAIMode()

    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Send initial greeting when AI mode is activated
    useEffect(() => {
        if (messages.length === 0 && chatPhase === "intro") {
            setTimeout(() => {
                addMessage({
                    role: "assistant",
                    content: "👋 Hello! I'm your AI Talent Scout. I can help you find the perfect candidates for your team without manually creating job postings!\n\nDescribe what kind of talent you're looking for - the skills needed, the type of role, experience level, or any specific requirements. I'll search through our student database and find the best matches for you.",
                    metadata: { type: "question" }
                })
                setChatPhase("gathering")
            }, 500)
        }
    }, [messages.length, chatPhase, addMessage, setChatPhase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue("")
        
        addMessage({
            role: "user",
            content: userMessage
        })

        setIsLoading(true)
        setIsTyping(true)

        try {
            const response = await fetch("/api/assistant/ai-mode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    phase: chatPhase,
                    userType: "company"
                })
            })

            const data = await response.json()

            if (data.error) {
                addMessage({
                    role: "assistant",
                    content: "I apologize, but I encountered an issue. Please try again or rephrase your message."
                })
            } else {
                addMessage({
                    role: "assistant",
                    content: data.reply,
                    metadata: { type: data.type, data: data.data }
                })

                // Update state based on response
                if (data.phase) {
                    setChatPhase(data.phase)
                }

                if (data.matches) {
                    setStudentMatches(data.matches)
                }
            }
        } catch (error) {
            console.error("AI Mode error:", error)
            addMessage({
                role: "assistant",
                content: "I'm having trouble connecting. Please check your connection and try again."
            })
        } finally {
            setIsLoading(false)
            setIsTyping(false)
        }
    }

    const handleStartOver = () => {
        clearMessages()
        setStudentMatches([])
    }

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-500 to-emerald-500"
        if (percentage >= 60) return "from-blue-500 to-indigo-500"
        if (percentage >= 40) return "from-yellow-500 to-orange-500"
        return "from-gray-500 to-slate-500"
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/5 border border-indigo-500/20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-cyan-500/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-sm shadow-lg">
                                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                                AI Talent Scout
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Find perfect candidates with AI-powered search
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleStartOver}
                        className="rounded-xl px-4 py-2 text-sm font-bold hover:bg-indigo-500/10"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start Over
                    </Button>
                </div>

                {/* Progress indicator */}
                <div className="relative z-10 mt-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className={cn("flex items-center gap-1", chatPhase !== "intro" && "text-indigo-600 dark:text-indigo-400")}>
                            <Building2 className="h-3 w-3" /> Your Needs
                        </span>
                        <span className={cn("flex items-center gap-1", ["matching", "results"].includes(chatPhase) && "text-indigo-600 dark:text-indigo-400")}>
                            <Search className="h-3 w-3" /> Searching
                        </span>
                        <span className={cn("flex items-center gap-1", chatPhase === "results" && "text-indigo-600 dark:text-indigo-400")}>
                            <Users className="h-3 w-3" /> Candidates
                        </span>
                    </div>
                    <Progress 
                        value={
                            chatPhase === "intro" ? 0 :
                            chatPhase === "gathering" ? 33 :
                            chatPhase === "matching" ? 66 : 100
                        } 
                        className="h-2 bg-indigo-500/20"
                    />
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Chat Section */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            <AnimatePresence>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={cn(
                                            "flex gap-3",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 h-fit">
                                                <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-3",
                                            message.role === "user" 
                                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
                                                : "bg-muted/50 border border-border/50"
                                        )}>
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        </div>

                                        {message.role === "user" && (
                                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 h-fit">
                                                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                                        <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
                                        <div className="flex gap-1">
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                                className="w-2 h-2 rounded-full bg-indigo-500"
                                            />
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                                className="w-2 h-2 rounded-full bg-indigo-500"
                                            />
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                                className="w-2 h-2 rounded-full bg-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-muted/20">
                        <div className="flex gap-3">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Describe the talent you're looking for..."
                                className="flex-1 rounded-xl border-2 border-border/50 focus:border-indigo-500/50 bg-background"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="rounded-xl px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Results Sidebar */}
                <div className="space-y-4 overflow-auto">
                    {/* Student Matches */}
                    {studentMatches.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-blue-500/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-indigo-600" />
                                        Matching Candidates
                                        <Badge variant="secondary" className="ml-auto">
                                            {studentMatches.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {studentMatches.slice(0, 6).map((match, index) => (
                                        <motion.div
                                            key={match.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-indigo-500/30">
                                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-600 text-sm font-bold">
                                                        {match.name?.charAt(0) || "S"}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm truncate">{match.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {match.portfolio?.headline || match.email}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "flex-shrink-0 px-2 py-1 rounded-lg text-white text-xs font-bold bg-gradient-to-r",
                                                            getMatchColor(match.matchPercentage)
                                                        )}>
                                                            {match.matchPercentage}%
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {(match.skills || []).slice(0, 3).map((skill, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs py-0">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg">
                                                            <User className="h-3 w-3 mr-1" />
                                                            Profile
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            Contact
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Empty state */}
                    {studentMatches.length === 0 && (
                        <Card className="border-dashed border-2 border-border/50">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-4 rounded-2xl bg-indigo-500/10 mb-4">
                                    <Search className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Tell me what kind of talent you need and I&apos;ll find the best matching candidates
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick search suggestions */}
                    <Card className="border border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4 w-4" />
                                Quick Searches
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {[
                                "React developer with TypeScript experience",
                                "Python data science intern",
                                "UI/UX design student",
                                "Full-stack developer"
                            ].map((suggestion, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs h-8 rounded-lg hover:bg-indigo-500/10 text-left"
                                    onClick={() => setInputValue(suggestion)}
                                >
                                    <Sparkles className="h-3 w-3 mr-2 text-indigo-500" />
                                    {suggestion}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
