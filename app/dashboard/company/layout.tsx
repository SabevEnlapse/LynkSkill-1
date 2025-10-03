import type React from "react"
export const dynamic = "force-dynamic"

export default function CompanyDashboardLayout({
                                                   children,
                                               }: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
