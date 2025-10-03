import type React from "react"
export const dynamic = "force-dynamic"

export default function StudentDashboardLayout({
                                                   children,
                                               }: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
