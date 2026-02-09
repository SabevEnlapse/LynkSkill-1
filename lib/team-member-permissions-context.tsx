"use client"

import React, { createContext, useContext, useMemo } from "react"

interface TeamMemberPermissionsContextType {
    permissions: string[]
    role: string
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (...permissions: string[]) => boolean
    hasAllPermissions: (...permissions: string[]) => boolean
}

const TeamMemberPermissionsContext = createContext<TeamMemberPermissionsContextType | null>(null)

interface TeamMemberPermissionsProviderProps {
    children: React.ReactNode
    permissions: string[]
    role: string
}

export function TeamMemberPermissionsProvider({ 
    children, 
    permissions,
    role 
}: TeamMemberPermissionsProviderProps) {
    const value = useMemo<TeamMemberPermissionsContextType>(() => {
        const permSet = new Set(permissions)
        return {
            permissions,
            role,
            hasPermission: (p: string) => permSet.has(p),
            hasAnyPermission: (...ps: string[]) => ps.some(p => permSet.has(p)),
            hasAllPermissions: (...ps: string[]) => ps.every(p => permSet.has(p)),
        }
    }, [permissions, role])

    return (
        <TeamMemberPermissionsContext.Provider value={value}>
            {children}
        </TeamMemberPermissionsContext.Provider>
    )
}

export function useTeamMemberPermissions() {
    const context = useContext(TeamMemberPermissionsContext)
    if (!context) {
        // Return a default context when not wrapped in provider (e.g., company/student dashboards)
        return {
            permissions: [] as string[],
            role: "",
            hasPermission: () => false,
            hasAnyPermission: () => false,
            hasAllPermissions: () => false,
        }
    }
    return context
}
