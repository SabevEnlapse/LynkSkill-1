"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Settings, Bell, Palette, Globe, 
    Check, Loader2, RotateCcw, ChevronRight, 
    Eye, EyeOff, MessageSquare, Clock, Mail,
    Sparkles, Moon, Sun, Monitor, Users
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n"
import { useSettings } from "@/lib/settings-context"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type SettingsTab = "notifications" | "privacy" | "appearance" | "language"

export default function SettingsPage() {
    const { t, locale, setLocale } = useTranslation()
    const { theme, setTheme } = useTheme()
    const { settings, updateSetting, resetSettings, isSaving } = useSettings()
    const [activeTab, setActiveTab] = useState<SettingsTab>("notifications")
    const [showResetDialog, setShowResetDialog] = useState(false)

    const tabs = [
        { id: "notifications" as const, label: t('settingsPage.notifications'), icon: Bell },
        { id: "privacy" as const, label: t('settingsPage.privacy'), icon: Eye },
        { id: "appearance" as const, label: t('settingsPage.appearance'), icon: Palette },
        { id: "language" as const, label: t('settingsPage.language'), icon: Globe },
    ]

    const handleToggle = (key: keyof typeof settings, value: boolean) => {
        updateSetting(key, value)
        toast.success(t('settingsPage.settingUpdated'), {
            description: t('settingsPage.settingToggleDesc', { key, state: value ? t('settingsPage.enabled') : t('settingsPage.disabled') }),
            duration: 2000,
        })
    }

    const handleReset = () => {
        resetSettings()
        setShowResetDialog(false)
        toast.success(t('settingsPage.settingsReset'), {
            description: t('settingsPage.settingsResetDesc'),
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-blue-500/5 border border-purple-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                            <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.settings')}</h1>
                            <p className="text-muted-foreground/70">{t('settingsPage.managePreferences')}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isSaving && (
                            <Badge variant="secondary" className="gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {t('settingsPage.saving')}
                            </Badge>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowResetDialog(true)}
                                    className="hidden md:flex gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    {t('settingsPage.resetAll')}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('settingsPage.resetAllToDefaults')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                {/* Sidebar Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="sticky top-20">
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                    activeTab === tab.id
                                                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-purple-600 dark:text-purple-400"
                                                        : "text-muted-foreground/70 hover:bg-muted hover:text-foreground/80"
                                                )}
                                            >
                                                <tab.icon className="h-4 w-4" />
                                                {tab.label}
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 ml-auto transition-transform",
                                                    activeTab === tab.id && "rotate-90"
                                                )} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{t('settingsPage.manageSettings', { tab: tab.label.toLowerCase() })}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Settings Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="wait">
                        {activeTab === "notifications" && (
                            <SettingsSection key="notifications" title={t('settingsPage.notificationPreferences')} description={t('settingsPage.chooseNotifications')}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Mail className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.emailNotifications')}
                                        </h3>
                                        
                                        <SettingToggle
                                            label={t('settingsPage.emailNotifications')}
                                            description={t('settingsPage.emailNotificationsDesc')}
                                            tooltip={t('settingsPage.emailNotificationsTooltip')}
                                            checked={settings.emailNotifications}
                                            onChange={(v) => handleToggle("emailNotifications", v)}
                                        />
                                        
                                        <SettingToggle
                                            label={t('settingsPage.weeklyDigest')}
                                            description={t('settingsPage.weeklyDigestDesc')}
                                            tooltip={t('settingsPage.weeklyDigestTooltip')}
                                            checked={settings.weeklyDigest}
                                            onChange={(v) => handleToggle("weeklyDigest", v)}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Bell className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.pushNotifications')}
                                        </h3>
                                        
                                        <SettingToggle
                                            label={t('settingsPage.pushNotifications')}
                                            description={t('settingsPage.pushNotificationsDesc')}
                                            tooltip={t('settingsPage.pushNotificationsTooltip')}
                                            checked={settings.pushNotifications}
                                            onChange={(v) => handleToggle("pushNotifications", v)}
                                        />
                                        
                                        <SettingToggle
                                            label={t('settingsPage.newApplications')}
                                            description={t('settingsPage.newApplicationsDesc')}
                                            tooltip={t('settingsPage.newApplicationsTooltip')}
                                            checked={settings.applicationUpdates}
                                            onChange={(v) => handleToggle("applicationUpdates", v)}
                                        />
                                        
                                        <SettingToggle
                                            label={t('settingsPage.interviewReminders')}
                                            description={t('settingsPage.interviewRemindersDesc')}
                                            tooltip={t('settingsPage.interviewRemindersTooltip')}
                                            checked={settings.interviewReminders}
                                            onChange={(v) => handleToggle("interviewReminders", v)}
                                        />
                                    </div>
                                </div>
                            </SettingsSection>
                        )}

                        {activeTab === "privacy" && (
                            <SettingsSection key="privacy" title={t('settingsPage.privacySettings')} description={t('settingsPage.controlVisibility')}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Eye className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.companyVisibility')}
                                        </h3>
                                        
                                        <RadioGroup 
                                            value={settings.profileVisibility}
                                            onValueChange={(v) => {
                                                updateSetting("profileVisibility", v as "public" | "private" | "connections")
                                                toast.success(t('settingsPage.visibilityUpdated'), {
                                                    description: t('settingsPage.visibilityUpdatedDesc', { visibility: v }),
                                                })
                                            }}
                                            className="space-y-3"
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                                        settings.profileVisibility === "public" 
                                                            ? "border-purple-500 bg-purple-500/5" 
                                                            : "border-border hover:border-purple-500/30"
                                                    )}>
                                                        <RadioGroupItem value="public" id="public" />
                                                        <Label htmlFor="public" className="flex-1 cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="h-4 w-4 text-purple-400" />
                                                                <span className="font-medium text-foreground/80">{t('settingsPage.public')}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground/60 mt-1">{t('settingsPage.publicDesc')}</p>
                                                        </Label>
                                                        {settings.profileVisibility === "public" && (
                                                            <Check className="h-5 w-5 text-purple-500" />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('settingsPage.publicTooltip')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                                        settings.profileVisibility === "connections" 
                                                            ? "border-purple-500 bg-purple-500/5" 
                                                            : "border-border hover:border-purple-500/30"
                                                    )}>
                                                        <RadioGroupItem value="connections" id="connections" />
                                                        <Label htmlFor="connections" className="flex-1 cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-blue-400" />
                                                                <span className="font-medium text-foreground/80">{t('settingsPage.applicantsOnly')}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground/60 mt-1">{t('settingsPage.applicantsOnlyDesc')}</p>
                                                        </Label>
                                                        {settings.profileVisibility === "connections" && (
                                                            <Check className="h-5 w-5 text-purple-500" />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('settingsPage.applicantsOnlyTooltip')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                                        settings.profileVisibility === "private" 
                                                            ? "border-purple-500 bg-purple-500/5" 
                                                            : "border-border hover:border-purple-500/30"
                                                    )}>
                                                        <RadioGroupItem value="private" id="private" />
                                                        <Label htmlFor="private" className="flex-1 cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                                                <span className="font-medium text-foreground/80">{t('settingsPage.private')}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground/60 mt-1">{t('settingsPage.privateDesc')}</p>
                                                        </Label>
                                                        {settings.profileVisibility === "private" && (
                                                            <Check className="h-5 w-5 text-purple-500" />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('settingsPage.privateTooltip')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </RadioGroup>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <MessageSquare className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.communication')}
                                        </h3>
                                        
                                        <SettingToggle
                                            label={t('settingsPage.showActivityStatus')}
                                            description={t('settingsPage.showActivityStatusDesc')}
                                            tooltip={t('settingsPage.showActivityStatusTooltip')}
                                            checked={settings.showOnlineStatus}
                                            onChange={(v) => handleToggle("showOnlineStatus", v)}
                                        />
                                        
                                        <SettingToggle
                                            label={t('settingsPage.allowDirectMessages')}
                                            description={t('settingsPage.allowDirectMessagesDesc')}
                                            tooltip={t('settingsPage.allowDirectMessagesTooltip')}
                                            checked={settings.allowMessages}
                                            onChange={(v) => handleToggle("allowMessages", v)}
                                        />
                                    </div>
                                </div>
                            </SettingsSection>
                        )}

                        {activeTab === "appearance" && (
                            <SettingsSection key="appearance" title={t('settingsPage.appearanceTitle')} description={t('settingsPage.customizeLook')}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Palette className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.theme')}
                                        </h3>
                                        
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { value: "light", label: t('settingsPage.light'), icon: Sun, tooltip: t('settingsPage.useLightTheme') },
                                                { value: "dark", label: t('settingsPage.dark'), icon: Moon, tooltip: t('settingsPage.useDarkTheme') },
                                                { value: "system", label: t('settingsPage.system'), icon: Monitor, tooltip: t('settingsPage.followSystem') },
                                            ].map((option) => (
                                                <Tooltip key={option.value}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setTheme(option.value)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                                                                theme === option.value
                                                                    ? "border-purple-500 bg-purple-500/10"
                                                                    : "border-border hover:border-purple-500/30"
                                                            )}
                                                        >
                                                            <option.icon className={cn(
                                                                "h-6 w-6",
                                                                theme === option.value ? "text-purple-500" : "text-muted-foreground/60"
                                                            )} />
                                                            <span className="text-sm font-medium text-foreground/70">{option.label}</span>
                                                            {theme === option.value && (
                                                                <Check className="h-4 w-4 text-purple-500" />
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{option.tooltip}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Sparkles className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.display')}
                                        </h3>
                                        
                                        <SettingToggle
                                            label={t('settingsPage.compactView')}
                                            description={t('settingsPage.compactViewDesc')}
                                            tooltip={t('settingsPage.compactViewTooltip')}
                                            checked={settings.compactView}
                                            onChange={(v) => handleToggle("compactView", v)}
                                        />
                                        
                                        <SettingToggle
                                            label={t('settingsPage.animations')}
                                            description={t('settingsPage.animationsDesc')}
                                            tooltip={t('settingsPage.animationsTooltip')}
                                            checked={settings.animationsEnabled}
                                            onChange={(v) => handleToggle("animationsEnabled", v)}
                                        />
                                    </div>
                                </div>
                            </SettingsSection>
                        )}

                        {activeTab === "language" && (
                            <SettingsSection key="language" title={t('settingsPage.languageAndRegion')} description={t('settingsPage.setLanguagePrefs')}>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Globe className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.languageLabel')}
                                        </h3>
                                        
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <Select value={locale} onValueChange={(v) => {
                                                        setLocale(v as "en" | "bg")
                                                        toast.success(t('settingsPage.languageUpdated'), {
                                                            description: v === "en" ? t('settingsPage.languageSetToEnglish') : t('settingsPage.languageSetToBulgarian'),
                                                        })
                                                    }}>
                                                        <SelectTrigger className="w-full h-12 rounded-xl">
                                                            <SelectValue placeholder={t('settingsPage.selectLanguage')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="en">
                                                                <div className="flex items-center gap-2">
                                                                    <span>🇬🇧</span>
                                                                    <span>English</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="bg">
                                                                <div className="flex items-center gap-2">
                                                                    <span>🇧🇬</span>
                                                                    <span>Български</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('settingsPage.changeInterfaceLanguage')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/60">
                                            <Clock className="h-4 w-4 text-purple-400" />
                                            {t('settingsPage.timeZone')}
                                        </h3>
                                        
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <Select defaultValue="Europe/Sofia">
                                                        <SelectTrigger className="w-full h-12 rounded-xl">
                                                            <SelectValue placeholder={t('settingsPage.selectTimezone')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Europe/Sofia">(UTC+02:00) Sofia</SelectItem>
                                                            <SelectItem value="Europe/London">(UTC+00:00) London</SelectItem>
                                                            <SelectItem value="America/New_York">(UTC-05:00) New York</SelectItem>
                                                            <SelectItem value="America/Los_Angeles">(UTC-08:00) Los Angeles</SelectItem>
                                                            <SelectItem value="Asia/Tokyo">(UTC+09:00) Tokyo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('settingsPage.setLocalTimezone')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </SettingsSection>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Reset Dialog */}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('settingsPage.resetAllSettings')}</DialogTitle>
                        <DialogDescription>
                            {t('settingsPage.resetConfirmation')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                            {t('settingsPage.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleReset}>
                            {t('settingsPage.resetAll')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SettingsSection({ 
    children, 
    title, 
    description 
}: { 
    children: React.ReactNode
    title: string
    description: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground/90">{title}</CardTitle>
                    <CardDescription className="text-muted-foreground/60">{description}</CardDescription>
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </motion.div>
    )
}

function SettingToggle({
    label,
    description,
    tooltip,
    checked,
    onChange,
}: {
    label: string
    description: string
    tooltip: string
    checked: boolean
    onChange: (value: boolean) => void
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center justify-between p-4 rounded-xl border hover:border-purple-500/30 transition-colors cursor-pointer">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium text-foreground/70 cursor-pointer">{label}</Label>
                        <p className="text-xs text-muted-foreground/60">{description}</p>
                    </div>
                    <Switch checked={checked} onCheckedChange={onChange} />
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    )
}
