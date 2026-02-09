import type React from "react"
import { auth } from "@clerk/nextjs/server"
import { getDashboardData } from "@/lib/server-data"
import { DashboardProvider } from "@/lib/dashboard-context"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardProviders } from "@/components/dashboard/dashboard-providers"
import { getUserCompanyByClerkId, CompanyMemberWithPermissions } from "@/lib/permissions"
import { getMemberPermissions } from "@/lib/permissions"
import { TeamMemberPermissionsProvider } from "@/lib/team-member-permissions-context"

export const revalidate = 60

export default async function TeamMemberDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId } = await auth()
    
    // Get member permissions for sidebar navigation
    let permissions: string[] = []
    let memberRole: string = "MEMBER"
    
    if (userId) {
        const membership = await getUserCompanyByClerkId(userId)
        if (membership) {
            const perms = getMemberPermissions(membership as CompanyMemberWithPermissions)
            permissions = perms.map(p => p.toString())
            memberRole = membership.defaultRole || "MEMBER"
        }
    }

    const initialData = await getDashboardData("TeamMember")

    const serializedData = {
        user: initialData.user,
        company: initialData.company,
        internships: initialData.internships.map(i => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
            applicationStart: i.applicationStart?.toISOString() ?? null,
            applicationEnd: i.applicationEnd?.toISOString() ?? null,
        })),
        applications: initialData.applications.map(a => ({
            ...a,
            createdAt: a.createdAt.getTime(),
        })),
        projects: initialData.projects.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            status: "ONGOING" as const,
            internship: {
                ...p.internship,
                startDate: p.internship.startDate?.toISOString() ?? null,
                endDate: p.internship.endDate?.toISOString() ?? null,
            }
        })),
        recentExperiences: initialData.recentExperiences.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
        })),
    }

    return (
        <DashboardProviders>
            <DashboardProvider userType="TeamMember" initialData={serializedData}>
                <TeamMemberPermissionsProvider permissions={permissions} role={memberRole}>
                    <DashboardShell userType="TeamMember" memberPermissions={permissions}>
                        {children}
                    </DashboardShell>
                </TeamMemberPermissionsProvider>
            </DashboardProvider>
        </DashboardProviders>
    )
}
