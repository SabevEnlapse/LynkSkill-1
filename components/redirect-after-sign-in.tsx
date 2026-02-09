"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2, Sparkles, CheckCircle } from "lucide-react"

const loadingMessages = [
    "Setting up your account",
    "Preparing your dashboard",
    "Almost there",
]

export default function RedirectAfterSignIn() {
    const router = useRouter()
    const { user, isSignedIn, isLoaded } = useUser()
    const [messageIndex, setMessageIndex] = useState(0)
    const [progress, setProgress] = useState(0)

    // Cycle through loading messages
    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
        }, 2000)

        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
        }, 300)

        return () => {
            clearInterval(messageInterval)
            clearInterval(progressInterval)
        }
    }, [])

    useEffect(() => {
        if (!isLoaded) return

        if (!isSignedIn || !user) {
            router.replace("/sign-in")
            return
        }

        // Use Clerk's publicMetadata instead of API call for faster redirect
        const metadata = user.publicMetadata as { role?: string; onboardingComplete?: boolean } | undefined
        
        // Small delay for smooth transition
        const redirectTimeout = setTimeout(() => {
            setProgress(100)
            
            setTimeout(() => {
                if (!metadata?.role || !metadata.onboardingComplete) {
                    router.replace("/onboarding")
                    return
                }

                const role = (metadata.role || "").toUpperCase()
                if (role === "STUDENT") {
                    router.replace("/dashboard/student")
                } else if (role === "COMPANY") {
                    router.replace("/dashboard/company")
                } else if (role === "TEAM_MEMBER") {
                    router.replace("/dashboard/team-member")
                } else {
                    router.replace("/onboarding")
                }
            }, 300)
        }, 800)

        return () => clearTimeout(redirectTimeout)
    }, [user, isSignedIn, isLoaded, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center gap-8 max-w-md text-center px-6">
                {/* Logo/Icon area */}
                <div className="relative">
                    {/* Outer ring animation */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
                    
                    {/* Main circle with gradient */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 shadow-xl shadow-primary/20">
                        {progress < 100 ? (
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        ) : (
                            <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />
                        )}
                    </div>

                    {/* Sparkles decoration */}
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
                    <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-purple-400 animate-pulse delay-500" />
                </div>

                {/* Text content */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {loadingMessages[messageIndex]}...
                    </h2>
                    <p className="text-muted-foreground text-balance leading-relaxed">
                        Please wait while we prepare your personalized experience
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs space-y-2">
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                        {progress < 100 ? "Loading your profile..." : "Complete!"}
                    </p>
                </div>

                {/* Decorative dots */}
                <div className="flex gap-2 mt-4">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i === messageIndex 
                                    ? "bg-primary scale-125" 
                                    : "bg-muted-foreground/30"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
