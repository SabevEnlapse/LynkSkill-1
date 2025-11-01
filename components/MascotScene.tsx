"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface MascotSceneProps {
    steps: string[]
    onFinish: () => void
    mascotUrl: string
    setActiveTab: (tab: string) => void
    userType: "Student" | "Company"
}

export function MascotScene({
                                steps,
                                onFinish,
                                mascotUrl,
                                setActiveTab,
                                userType,
                            }: MascotSceneProps) {
    const [visible, setVisible] = useState(true)
    const [stepIndex, setStepIndex] = useState(0)
    const [fadeOut, setFadeOut] = useState(false)

    // ✅ Add final message automatically
    const allSteps = [
        ...steps,
        `🎉 This is all for you to start — enjoy and make sure you <strong>link your skills</strong>!`,
    ]

    // 🎯 Tab redirection logic per step
    useEffect(() => {
        const studentRedirects: Record<number, string> = {
            3: "apps",
            4: "home",
            5: "files",
            6: "projects",
            7: "learn",
        }

        const companyRedirects: Record<number, string> = {
            3: "home",
            4: "files",
            5: "projects",
            6: "learn",
        }

        const redirects = userType === "Student" ? studentRedirects : companyRedirects
        const tab = redirects[stepIndex as keyof typeof redirects]
        if (tab) setActiveTab(tab)

        // 🏠 If it's the final message → return to Home
        if (stepIndex === allSteps.length - 1) setActiveTab("home")
    }, [stepIndex, setActiveTab, userType, allSteps.length])

    // 🧭 Handle navigation
    const handleNext = () => {
        if (stepIndex < allSteps.length - 1) {
            setStepIndex((prev) => prev + 1)
        } else {
            // 🎬 Fade out before finishing
            setFadeOut(true)
            setTimeout(() => {
                setVisible(false)
                onFinish()
            }, 1000)
        }
    }

    const handleBack = () => {
        if (stepIndex > 0) setStepIndex((prev) => prev - 1)
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-end bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0, x: "100vw" }}
                    animate={{
                        opacity: fadeOut ? 0 : 1,
                        x: fadeOut ? "100vw" : 0,
                    }}
                    exit={{ opacity: 0, x: "100vw" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <motion.div
                        className="flex flex-col-reverse md:flex-row items-center gap-6 md:gap-8 w-full justify-end"
                        initial={{ x: "100vw" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100vw" }}
                        transition={{ type: "spring", stiffness: 70, damping: 20 }}
                    >
                        {/* 💬 Message Bubble */}
                        <motion.div
                            className="relative"
                            key={stepIndex}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                        >
                            <div className="relative bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-3xl px-8 py-6 shadow-2xl max-w-md">
                                <p
                                    className="text-lg md:text-xl font-semibold mb-6 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: allSteps[stepIndex] }}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleBack}
                                        disabled={stepIndex === 0}
                                        variant="outline"
                                        className={`flex-1 rounded-2xl font-bold ${
                                            stepIndex === 0
                                                ? "opacity-50 cursor-not-allowed"
                                                : "bg-transparent border-white text-white hover:bg-white/20"
                                        }`}
                                    >
                                        Back
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="flex-1 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-bold"
                                    >
                                        {stepIndex === allSteps.length - 1 ? "Finish" : "Next"}
                                    </Button>
                                </div>

                                {/* Pointer */}
                                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[20px] border-t-transparent border-l-[20px] border-l-blue-500 border-b-[20px] border-b-transparent" />
                            </div>
                        </motion.div>

                        {/* 🦊 Mascot */}
                        <motion.div
                            className="relative flex justify-end overflow-hidden"
                            initial={{ x: "50%" }}
                            animate={{ x: 0 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
                        >
                            <div className="relative w-[400px] h-[400px] md:w-[600px] md:h-[600px] ml-auto">
                                <Image
                                    src={mascotUrl || "/placeholder.svg"}
                                    alt="Mascot"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
