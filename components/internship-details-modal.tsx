"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Briefcase,
    MapPin,
    GraduationCap,
    DollarSign,
    FileText,
    Clock,
    Building2,
    ExternalLink,
    AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface Internship {
    id: string
    title: string
    description: string
    qualifications?: string
    location: string
    paid: boolean
    salary?: number
    applicationStart: string
    applicationEnd: string
    company: {
        id: string
        name: string
        location: string
        website: string | null
        logo: string | null
        description: string
    }
}

interface InternshipDetailsModalProps {
    internshipId: string | null
    open: boolean
    onClose: () => void
}

function SkeletonLoader() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="h-8 w-3/4 bg-slate-700/50 rounded-lg animate-pulse" />
                <div className="flex gap-4">
                    <div className="h-5 w-32 bg-slate-700/50 rounded-lg animate-pulse" />
                    <div className="h-5 w-24 bg-slate-700/50 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Quick Info Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                        <div className="h-5 w-32 bg-slate-700/50 rounded-lg animate-pulse" />
                        <div className="h-6 w-24 bg-slate-700/50 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-40 bg-slate-700/50 rounded-lg animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-700/50 rounded-lg animate-pulse" />
                    <div className="h-4 w-full bg-slate-700/50 rounded-lg animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-700/50 rounded-lg animate-pulse" />
                </div>
            </div>
        </div>
    )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
        >
            <div className="p-4 rounded-full bg-red-500/10">
                <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-slate-200">Failed to Load Internship</h3>
                <p className="text-sm text-slate-400">There was an error loading the internship details.</p>
            </div>
            <Button onClick={onRetry} className="rounded-xl px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white">
                Try Again
            </Button>
        </motion.div>
    )
}

export default function InternshipDetailsModal({ internshipId, open, onClose }: InternshipDetailsModalProps) {
    const [internship, setInternship] = useState<Internship | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const fetchInternship = async () => {
        if (!internshipId) return

        setLoading(true)
        setError(false)

        try {
            const res = await fetch(`/api/internships/${internshipId}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setInternship(data)
        } catch (err) {
            console.error("Error fetching internship:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && internshipId) {
            fetchInternship()
        }
    }, [open, internshipId])

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 border border-slate-800 bg-slate-900 shadow-2xl">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8"
                        >
                            <SkeletonLoader />
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8"
                        >
                            <ErrorState onRetry={fetchInternship} />
                        </motion.div>
                    ) : internship ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-slate-900 rounded-2xl"
                        >
                            {/* Header with gradient background */}
                            <div className="relative overflow-hidden rounded-t-2xl p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                                <div className="relative z-10">
                                    <div className="flex items-start gap-4 mb-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1, type: "spring" }}
                                            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                                        >
                                            <Briefcase className="h-8 w-8 text-white" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-3xl font-bold text-white mb-2 text-balance">
                                                {internship.title}
                                            </DialogTitle>
                                            <div className="flex flex-wrap items-center gap-4 text-white/90">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{internship.location}</span>
                                                </div>
                                                {internship.paid && internship.salary && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span className="text-sm font-medium">${internship.salary}/month</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Company Info Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-blue-500/10">
                                            <Building2 className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h3 className="text-lg font-semibold text-slate-200">{internship.company.name}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{internship.company.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {internship.company.location}
                                                </div>
                                                {internship.company.website && (
                                                    <a
                                                        href={internship.company.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Visit Website
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Quick Info Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="p-5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-purple-500/10">
                                                <Clock className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-300">Application Period</h3>
                                        </div>
                                        <div className="space-y-1 ml-11">
                                            <p className="text-white font-medium">
                                                {format(new Date(internship.applicationStart), "MMM d, yyyy")}
                                            </p>
                                            <p className="text-slate-400 text-sm">
                                                to {format(new Date(internship.applicationEnd), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <DollarSign className="h-5 w-5 text-green-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-300">Compensation</h3>
                                        </div>
                                        <div className="ml-11">
                                            {internship.paid && internship.salary ? (
                                                <>
                                                    <p className="text-white font-medium text-lg">${internship.salary}</p>
                                                    <p className="text-slate-400 text-sm">per month</p>
                                                </>
                                            ) : (
                                                <p className="text-slate-400 font-medium">Unpaid</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Description */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                        <h3 className="text-lg font-semibold text-slate-200">About This Role</h3>
                                    </div>
                                    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <p className="text-slate-300 leading-relaxed text-pretty">{internship.description}</p>
                                    </div>
                                </motion.div>

                                {/* Qualifications */}
                                {internship.qualifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5 text-purple-400" />
                                            <h3 className="text-lg font-semibold text-slate-200">Qualifications</h3>
                                        </div>
                                        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-slate-300 leading-relaxed text-pretty">{internship.qualifications}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
