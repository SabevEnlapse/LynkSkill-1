"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface AIMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    metadata?: {
        type?: "portfolio" | "match" | "question" | "search"
        data?: unknown
    }
}

interface InternshipMatch {
    id: string
    title: string
    company: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
}

interface StudentMatch {
    id: string
    name: string
    email: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
    portfolio?: {
        headline?: string
        about?: string
    }
}

interface AIModeContextType {
    isAIMode: boolean
    toggleAIMode: () => void
    messages: AIMessage[]
    addMessage: (message: Omit<AIMessage, "id" | "timestamp">) => void
    clearMessages: () => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    internshipMatches: InternshipMatch[]
    setInternshipMatches: (matches: InternshipMatch[]) => void
    studentMatches: StudentMatch[]
    setStudentMatches: (matches: StudentMatch[]) => void
    generatedPortfolio: Record<string, unknown> | null
    setGeneratedPortfolio: (portfolio: Record<string, unknown> | null) => void
    chatPhase: "intro" | "gathering" | "portfolio" | "matching" | "results"
    setChatPhase: (phase: "intro" | "gathering" | "portfolio" | "matching" | "results") => void
}

const AIModeContext = createContext<AIModeContextType | undefined>(undefined)

export function AIModeProvider({ children }: { children: ReactNode }) {
    const [isAIMode, setIsAIMode] = useState(false)
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [internshipMatches, setInternshipMatches] = useState<InternshipMatch[]>([])
    const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([])
    const [generatedPortfolio, setGeneratedPortfolio] = useState<Record<string, unknown> | null>(null)
    const [chatPhase, setChatPhase] = useState<"intro" | "gathering" | "portfolio" | "matching" | "results">("intro")

    const toggleAIMode = useCallback(() => {
        setIsAIMode(prev => {
            if (prev) {
                // Resetting when turning off
                setMessages([])
                setChatPhase("intro")
                setInternshipMatches([])
                setStudentMatches([])
                setGeneratedPortfolio(null)
            }
            return !prev
        })
    }, [])

    const addMessage = useCallback((message: Omit<AIMessage, "id" | "timestamp">) => {
        const newMessage: AIMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, newMessage])
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
        setChatPhase("intro")
    }, [])

    return (
        <AIModeContext.Provider value={{
            isAIMode,
            toggleAIMode,
            messages,
            addMessage,
            clearMessages,
            isLoading,
            setIsLoading,
            internshipMatches,
            setInternshipMatches,
            studentMatches,
            setStudentMatches,
            generatedPortfolio,
            setGeneratedPortfolio,
            chatPhase,
            setChatPhase
        }}>
            {children}
        </AIModeContext.Provider>
    )
}

export function useAIMode() {
    const context = useContext(AIModeContext)
    if (!context) {
        throw new Error("useAIMode must be used within an AIModeProvider")
    }
    return context
}
