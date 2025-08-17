"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "./_actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Building2, ArrowRight } from "lucide-react"

export default function OnboardingPage() {
    const [error, setError] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false)
    const { user } = useUser()
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError("")

        try {
            const res = await completeOnboarding(formData)
            if (res?.message) {
                await user?.reload()
                router.push("/")
            }
            if (res?.error) setError(res.error)
        } catch (err) {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const roles = [
        {
            value: "student",
            title: "Student",
            description: "Access learning resources, track progress, and connect with peers",
            icon: GraduationCap,
            features: ["Course Materials", "Progress Tracking", "Peer Network", "Study Tools"],
            color: "bg-blue-50 border-blue-200 hover:border-blue-300",
            iconColor: "text-blue-600",
        },
        {
            value: "company",
            title: "Company",
            description: "Manage teams, access enterprise features, and drive business growth",
            icon: Building2,
            features: ["Team Management", "Analytics Dashboard", "Enterprise Tools", "Priority Support"],
            color: "bg-purple-50 border-purple-200 hover:border-purple-300",
            iconColor: "text-purple-600",
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-slate-600">Welcome to LynkSkill</span>
                        </div>

                        <h1
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            Choose Your
                            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Journey
                            </span>
                        </h1>

                        <p
                            className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                        >
                            Select your role to unlock personalized features and get started with the right tools for your needs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <form action={handleSubmit} className="space-y-8">
                    {/* Role Selection Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {roles.map((role) => {
                            const Icon = role.icon
                            const isSelected = selectedRole === role.value

                            return (
                                <Card
                                    key={role.value}
                                    className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                                        isSelected ? "ring-2 ring-primary shadow-lg border-primary" : `${role.color} hover:shadow-md`
                                    }`}
                                    onClick={() => setSelectedRole(role.value)}
                                >
                                    <CardHeader className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`p-3 rounded-xl ${isSelected ? "bg-primary text-primary-foreground" : `bg-white ${role.iconColor}`}`}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            {isSelected && (
                                                <Badge variant="default" className="bg-primary">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <CardTitle className="text-xl text-slate-700 font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                                                {role.title}
                                            </CardTitle>
                                            <CardDescription className="text-base" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                                {role.description}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {role.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                    <span style={{ fontFamily: "var(--font-dm-sans)" }}>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>

                                    {/* Hidden radio input */}
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={isSelected}
                                        onChange={() => setSelectedRole(role.value)}
                                        className="sr-only"
                                        required
                                    />
                                </Card>
                            )
                        })}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-destructive font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Continue Button */}
                    <div className="flex justify-center pt-6">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!selectedRole || isLoading}
                            className="min-w-48 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-6" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            <a href="#" className="hover:text-slate-700 transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-slate-700 transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:text-slate-700 transition-colors">
                                Support
                            </a>
                        </div>
                        <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            <span>Need help?</span>
                            <a href="#" className="text-primary hover:underline">
                                Contact us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
