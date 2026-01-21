"use client"

import { RecentInternshipsSection } from "@/components/recent-internships-section"

export default function InternshipsPage() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <RecentInternshipsSection userType="Student" />
        </div>
    )
}
