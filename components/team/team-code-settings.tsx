"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    History,
    Settings,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

interface TeamCodeSettingsProps {
    companyId: string
}

interface CodeData {
    code: string
    maskedCode: string
    enabled: boolean
    expiresAt: string | null
    isExpired: boolean
    timeUntilExpiry: string | null
    maxTeamMembers: number | null
    currentMembers: number
    usageCount: number
    lastRegenAt: string | null
}

interface JoinHistoryItem {
    id: string
    userId: string
    userName: string
    userEmail: string
    joinedAt: string
}

export function TeamCodeSettings({ companyId }: TeamCodeSettingsProps) {
    const [codeData, setCodeData] = React.useState<CodeData | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [showCode, setShowCode] = React.useState(false)
    const [regenerating, setRegenerating] = React.useState(false)
    const [updatingSettings, setUpdatingSettings] = React.useState(false)
    const [showHistoryDialog, setShowHistoryDialog] = React.useState(false)
    const [history, setHistory] = React.useState<JoinHistoryItem[]>([])
    const [historyLoading, setHistoryLoading] = React.useState(false)
    const [showSettingsDialog, setShowSettingsDialog] = React.useState(false)
    const [maxMembers, setMaxMembers] = React.useState<string>("")

    // Fetch code data
    const fetchCodeData = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/company/code?companyId=${companyId}`)
            if (!res.ok) throw new Error("Failed to fetch code")
            const data = await res.json()
            setCodeData(data)
            setMaxMembers(data.maxTeamMembers?.toString() || "")
        } catch (error) {
            console.error("Error fetching code:", error)
            toast.error("Failed to load invitation code")
        } finally {
            setLoading(false)
        }
    }, [companyId])

    React.useEffect(() => {
        fetchCodeData()
    }, [fetchCodeData])

    // Copy code to clipboard
    const copyCode = async () => {
        if (!codeData) return
        try {
            await navigator.clipboard.writeText(codeData.code)
            toast.success("Invitation code copied to clipboard!")
        } catch {
            toast.error("Failed to copy code")
        }
    }

    // Regenerate code
    const regenerateCode = async () => {
        setRegenerating(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId }),
            })
            
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to regenerate code")
            }
            
            const data = await res.json()
            setCodeData(prev => prev ? { ...prev, code: data.code, maskedCode: data.maskedCode } : null)
            toast.success("Invitation code regenerated successfully!")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to regenerate code")
        } finally {
            setRegenerating(false)
        }
    }

    // Toggle code enabled/disabled
    const toggleCodeEnabled = async () => {
        if (!codeData) return
        setUpdatingSettings(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId, enabled: !codeData.enabled }),
            })
            
            if (!res.ok) throw new Error("Failed to update settings")
            
            setCodeData(prev => prev ? { ...prev, enabled: !prev.enabled } : null)
            toast.success(codeData.enabled ? "Invitation code disabled" : "Invitation code enabled")
        } catch {
            toast.error("Failed to update settings")
        } finally {
            setUpdatingSettings(false)
        }
    }

    // Update max members
    const updateMaxMembers = async () => {
        setUpdatingSettings(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    companyId, 
                    maxTeamMembers: maxMembers ? parseInt(maxMembers) : null 
                }),
            })
            
            if (!res.ok) throw new Error("Failed to update settings")
            
            await fetchCodeData()
            toast.success("Settings updated successfully")
            setShowSettingsDialog(false)
        } catch {
            toast.error("Failed to update settings")
        } finally {
            setUpdatingSettings(false)
        }
    }

    // Fetch join history
    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/company/code/history?companyId=${companyId}`)
            if (!res.ok) throw new Error("Failed to fetch history")
            const data = await res.json()
            setHistory(data.history)
        } catch {
            toast.error("Failed to load join history")
        } finally {
            setHistoryLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="border border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!codeData) {
        return (
            <Card className="border border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Failed to load invitation code</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-md shadow-indigo-500/20">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Team Invitation Code</CardTitle>
                            <CardDescription>
                                Share this unique code with team members to join your company
                            </CardDescription>
                        </div>
                    </div>
                    <Badge 
                        variant={codeData.enabled ? "default" : "secondary"}
                        className={codeData.enabled 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium" 
                            : "bg-muted text-muted-foreground"}
                    >
                        {codeData.enabled ? "✓ Active" : "Disabled"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Code Display */}
                <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-blue-50/80 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-blue-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-700/30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="font-mono text-xl md:text-2xl font-bold tracking-[0.15em] select-all text-indigo-700 dark:text-indigo-300">
                            {showCode ? codeData.code : codeData.maskedCode}
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowCode(!showCode)}
                                        >
                                            {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {showCode ? "Hide code" : "Show code"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={copyCode}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy code</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl border border-violet-200/30 dark:border-violet-800/20">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Used</div>
                        <div className="text-lg font-bold text-violet-700 dark:text-violet-300">{codeData.usageCount} times</div>
                    </div>
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Team Size</div>
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {codeData.currentMembers}
                            {codeData.maxTeamMembers && <span className="text-muted-foreground font-normal"> / {codeData.maxTeamMembers}</span>}
                        </div>
                    </div>
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/30 dark:border-emerald-800/20">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</div>
                        <div className="text-lg font-bold flex items-center gap-1.5">
                            {codeData.enabled ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span className="text-amber-600 dark:text-amber-400">Disabled</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/30 dark:border-indigo-800/20">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Expiration</div>
                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                            {codeData.timeUntilExpiry || "Never"}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={regenerateCode}
                        disabled={regenerating}
                        className="border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                    >
                        {regenerating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Regenerate Code
                    </Button>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={codeData.enabled}
                            onCheckedChange={toggleCodeEnabled}
                            disabled={updatingSettings}
                        />
                        <Label className="text-sm">
                            {codeData.enabled ? "Enabled" : "Disabled"}
                        </Label>
                    </div>

                    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    setShowHistoryDialog(true)
                                    fetchHistory()
                                }}
                            >
                                <History className="w-4 h-4 mr-2" />
                                View History
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Join History</DialogTitle>
                                <DialogDescription>
                                    Team members who joined using the invitation code
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-64 overflow-y-auto">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No one has joined using this code yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.userName}</p>
                                                    <p className="text-sm text-muted-foreground">{item.userEmail}</p>
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.joinedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Code Settings</DialogTitle>
                                <DialogDescription>
                                    Configure invitation code settings
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxMembers">Maximum Team Members</Label>
                                    <Input
                                        id="maxMembers"
                                        type="number"
                                        placeholder="No limit"
                                        value={maxMembers}
                                        onChange={(e) => setMaxMembers(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Leave empty for unlimited team size
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={updateMaxMembers} disabled={updatingSettings}>
                                    {updatingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Warning if code is disabled */}
                {!codeData.enabled && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Code Disabled</p>
                            <p className="text-sm text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                                Team members cannot join using this code until it&apos;s enabled again.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
