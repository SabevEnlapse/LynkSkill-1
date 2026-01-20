"use client"

import { motion } from "framer-motion"
import { Users, Search, Filter, Loader2, User, Mail, Briefcase, FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from "@/lib/i18n"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Candidate {
    id: string
    name: string
    email: string
    avatar?: string
    headline?: string
    bio?: string
    skills: string[]
    matchPercentage: number
    matchedSkills: string[]
    projectCount: number
    experienceCount: number
}

export default function CandidatesPage() {
    const { t } = useTranslation()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchCandidates = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (debouncedSearch) params.set("search", debouncedSearch)
            
            const response = await fetch(`/api/candidates?${params.toString()}`)
            const data = await response.json()
            
            if (data.candidates) {
                setCandidates(data.candidates)
            }
        } catch (error) {
            console.error("Error fetching candidates:", error)
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch])

    useEffect(() => {
        fetchCandidates()
    }, [fetchCandidates])

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-500 to-emerald-500"
        if (percentage >= 60) return "from-blue-500 to-cyan-500"
        if (percentage >= 40) return "from-yellow-500 to-orange-500"
        return "from-gray-500 to-slate-500"
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">{t('navigation.candidates')}</h1>
                        <p className="text-muted-foreground">Browse and search for potential candidates</p>
                    </div>
                </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search candidates by name, skills..." 
                        className="pl-10 rounded-xl border-violet-500/20 focus:border-violet-500/40"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="rounded-xl border-violet-500/30 hover:bg-violet-500/10">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : candidates.length === 0 ? (
                <Card className="border-dashed border-2 border-violet-500/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-2xl bg-violet-500/10 mb-4">
                            <Users className="h-10 w-10 text-violet-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                        <p className="text-muted-foreground max-w-md">
                            {searchTerm 
                                ? `No candidates match "${searchTerm}". Try a different search term.`
                                : "No students have registered yet. Check back later!"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate, index) => (
                        <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="border-border/50 hover:border-violet-500/30 transition-all hover:shadow-lg group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-violet-500/30">
                                            {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600 font-bold">
                                                {candidate.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{candidate.name}</CardTitle>
                                            {candidate.headline && (
                                                <p className="text-sm text-muted-foreground truncate">{candidate.headline}</p>
                                            )}
                                            <Badge 
                                                className={cn(
                                                    "mt-1 text-white border-0 bg-gradient-to-r",
                                                    getMatchColor(candidate.matchPercentage)
                                                )}
                                            >
                                                {candidate.matchPercentage}% Match
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Stats */}
                                    <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                                        {candidate.projectCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FolderOpen className="h-3 w-3" />
                                                {candidate.projectCount} project{candidate.projectCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {candidate.experienceCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {candidate.experienceCount} experience{candidate.experienceCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {candidate.skills.slice(0, 4).map((skill) => (
                                            <Badge 
                                                key={skill} 
                                                variant="outline" 
                                                className={cn(
                                                    "text-xs",
                                                    candidate.matchedSkills.includes(skill) && "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                )}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                        {candidate.skills.length > 4 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{candidate.skills.length - 4}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                                            <User className="h-3.5 w-3.5 mr-1.5" />
                                            View Profile
                                        </Button>
                                        <Button size="sm" variant="outline" className="rounded-xl border-violet-500/30 hover:bg-violet-500/10">
                                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                                            Contact
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
