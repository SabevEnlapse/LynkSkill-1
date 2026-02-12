"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { useTeamMemberPermissions } from "@/lib/team-member-permissions-context"
import { useTranslation } from "@/lib/i18n"
import { 
    Building2, 
    Briefcase, 
    FileText, 
    Users, 
    MessageSquare, 
    Calendar, 
    Award, 
    Shield,
    Sparkles,
    ArrowRight
} from "lucide-react"
import Link from "next/link"

const ROLE_DISPLAY_KEYS: Record<string, { labelKey: string; color: string; bgColor: string }> = {
    OWNER: { labelKey: "teamMemberDashboard.roleOwner", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/30" },
    ADMIN: { labelKey: "teamMemberDashboard.roleAdmin", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
    HR_MANAGER: { labelKey: "teamMemberDashboard.roleHrManager", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
    HR_RECRUITER: { labelKey: "teamMemberDashboard.roleHrRecruiter", color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/30" },
    VIEWER: { labelKey: "teamMemberDashboard.roleViewer", color: "text-gray-400", bgColor: "bg-gray-500/10 border-gray-500/30" },
    MEMBER: { labelKey: "teamMemberDashboard.roleTeamMember", color: "text-indigo-400", bgColor: "bg-indigo-500/10 border-indigo-500/30" },
}

export default function TeamMemberDashboard() {
    const { t } = useTranslation()
    const { user, company, internships, applications } = useDashboard()
    const { permissions, role, hasPermission: _hasPermission, hasAnyPermission } = useTeamMemberPermissions()

    const roleInfoKey = ROLE_DISPLAY_KEYS[role] || ROLE_DISPLAY_KEYS.MEMBER
    const roleLabel = t(roleInfoKey.labelKey)
    const userName = user?.profile?.name || t('teamMemberDashboard.roleTeamMember')

    // Quick actions based on permissions
    const quickActions = [
        ...(hasAnyPermission("CREATE_INTERNSHIPS", "EDIT_INTERNSHIPS") ? [{
            label: t('teamMemberDashboard.internships'),
            description: t('teamMemberDashboard.internshipsDesc'),
            href: "/dashboard/team-member/internships",
            icon: <Briefcase className="h-6 w-6" />,
            color: "from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30",
            iconColor: "text-violet-400",
        }] : []),
        ...(hasAnyPermission("VIEW_APPLICATIONS", "MANAGE_APPLICATIONS") ? [{
            label: t('teamMemberDashboard.applicationsLabel'),
            description: t('teamMemberDashboard.applicationsDesc'),
            href: "/dashboard/team-member/applications",
            icon: <FileText className="h-6 w-6" />,
            color: "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30",
            iconColor: "text-blue-400",
        }] : []),
        ...(hasAnyPermission("VIEW_CANDIDATES", "SEARCH_CANDIDATES") ? [{
            label: t('teamMemberDashboard.candidatesLabel'),
            description: t('teamMemberDashboard.candidatesDesc'),
            href: "/dashboard/team-member/candidates",
            icon: <Users className="h-6 w-6" />,
            color: "from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30",
            iconColor: "text-emerald-400",
        }] : []),
        ...(hasAnyPermission("VIEW_MESSAGES", "SEND_MESSAGES") ? [{
            label: t('teamMemberDashboard.messagesLabel'),
            description: t('teamMemberDashboard.messagesDesc'),
            href: "/dashboard/team-member/messages",
            icon: <MessageSquare className="h-6 w-6" />,
            color: "from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30",
            iconColor: "text-amber-400",
        }] : []),
        ...(hasAnyPermission("SCHEDULE_INTERVIEWS", "CONDUCT_INTERVIEWS") ? [{
            label: t('teamMemberDashboard.interviewsLabel'),
            description: t('teamMemberDashboard.interviewsDesc'),
            href: "/dashboard/team-member/interviews",
            icon: <Calendar className="h-6 w-6" />,
            color: "from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30",
            iconColor: "text-pink-400",
        }] : []),
        ...(hasAnyPermission("CREATE_ASSIGNMENTS", "GRADE_EXPERIENCES") ? [{
            label: t('teamMemberDashboard.experienceLabel'),
            description: t('teamMemberDashboard.experienceDesc'),
            href: "/dashboard/team-member/experience",
            icon: <Award className="h-6 w-6" />,
            color: "from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30",
            iconColor: "text-indigo-400",
        }] : []),
        // Team - always visible
        {
            label: t('teamMemberDashboard.teamLabel'),
            description: t('teamMemberDashboard.teamDesc'),
            href: "/dashboard/team-member/team",
            icon: <Users className="h-6 w-6" />,
            color: "from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30",
            iconColor: "text-purple-400",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600/90 via-indigo-600/90 to-blue-600/90 p-6 md:p-8 text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="h-6 w-6 text-amber-300" />
                                <h1 className="text-2xl md:text-3xl font-bold">
                                    {t('teamMemberDashboard.welcomeBack', { name: userName })}
                                </h1>
                            </div>
                            <p className="text-white/70 text-sm md:text-base max-w-xl">
                                {t('teamMemberDashboard.teamMemberAt')} <span className="font-semibold text-white">{company?.name || t('teamMemberDashboard.yourCompany')}</span>. 
                                {t('teamMemberDashboard.dashboardDesc')}
                            </p>
                        </div>
                        
                        {/* Role Badge */}
                        <div className={`px-4 py-2 rounded-xl border ${roleInfoKey.bgColor} backdrop-blur-sm`}>
                            <div className="flex items-center gap-2">
                                <Shield className={`h-4 w-4 ${roleInfoKey.color}`} />
                                <span className={`text-sm font-semibold ${roleInfoKey.color}`}>
                                    {roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{internships?.length || 0}</p>
                            <p className="text-xs text-white/70">{t('teamMemberDashboard.internshipsCount')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{applications?.length || 0}</p>
                            <p className="text-xs text-white/70">{t('teamMemberDashboard.applicationsCount')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{permissions.length}</p>
                            <p className="text-xs text-white/70">{t('teamMemberDashboard.permissionsCount')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{quickActions.length}</p>
                            <p className="text-xs text-white/70">{t('teamMemberDashboard.availableTools')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            {quickActions.length > 0 ? (
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-500" />
                        {t('teamMemberDashboard.yourTools')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${action.color} p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`p-2.5 rounded-xl bg-background/50 ${action.iconColor}`}>
                                        {action.icon}
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-base font-semibold mt-3">{action.label}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">{t('teamMemberDashboard.limitedAccess')}</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                        {t('teamMemberDashboard.limitedAccessDesc', { role: roleLabel })}
                    </p>
                </div>
            )}

            {/* Permissions Overview */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-violet-500" />
                    {t('teamMemberDashboard.yourPermissions')}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {permissions.map((perm) => (
                        <span
                            key={perm}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400"
                        >
                            {perm.replace(/_/g, " ")}
                        </span>
                    ))}
                    {permissions.length === 0 && (
                        <span className="text-sm text-muted-foreground">{t('teamMemberDashboard.noPermissions')}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
