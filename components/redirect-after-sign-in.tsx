"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"

interface RedirectAfterSignInProps {
    message?: string
    subtitle?: string
    showProgress?: boolean
}

export default function RedirectAfterSignIn({
                                                message = "Redirecting...",
                                                subtitle = "Please wait while we prepare your experience",
                                                showProgress = true,
                                            }: RedirectAfterSignInProps) {
    const router = useRouter()
    const { user, isSignedIn, isLoaded } = useUser() // 👈 добавено isLoaded

    useEffect(() => {
        if (!isLoaded) return // изчакай зареждането на user

        async function checkRole() {
            if (!isSignedIn || !user) {
                router.replace("/sign-in") // това ще се случи само ако наистина не е влязъл
                return
            }

            const clerkId = user.id

            const res = await fetch("/api/get-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clerkId }),
            })
            const data = await res.json()

            if (data.role === "STUDENT") router.replace("/dashboard/student")
            else if (data.role === "COMPANY") router.replace("/dashboard/company")
            else router.replace("/onboarding") // ако няма role
        }

        checkRole()
    }, [user, isSignedIn, isLoaded, router])

    const [dots, setDots] = useState("")
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Animate dots
        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
        }, 500)

        // Animate progress if enabled
        let progressInterval: NodeJS.Timeout
        if (showProgress) {
            progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return prev
                    return prev + Math.random() * 15
                })
            }, 200)
        }

        return () => {
            clearInterval(dotsInterval)
            if (progressInterval) clearInterval(progressInterval)
        }
    }, [showProgress])

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
            <div className="text-center space-y-8 animate-fade-in-up">
                {/* Loading Spinner */}
                <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-muted animate-spin-smooth"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin-smooth"></div>
                    <div className="absolute inset-2 rounded-full bg-accent/10 animate-pulse-glow"></div>
                </div>

                {/* Main Message */}
                <div className="space-y-4">
                    <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground tracking-tight">
                        {message}
                        <span className="text-accent">{dots}</span>
                    </h1>

                    <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">{subtitle}</p>
                </div>

                {/* Progress Bar */}
                {showProgress && (
                    <div className="w-full max-w-xs mx-auto space-y-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-300 ease-out rounded-full"
                                style={{ width: `${Math.min(progress, 90)}%` }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">{Math.round(Math.min(progress, 90))}% complete</p>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className="flex justify-center space-x-2 opacity-60">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
                </div>
            </div>
        </div>
    )
}
