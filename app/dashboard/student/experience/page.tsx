"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import MyExperienceTabContent from "@/components/my-experience-tab-content"
import { useTranslation } from "@/lib/i18n"

function ExperienceContent() {
    const searchParams = useSearchParams()
    const projectId = searchParams?.get("project") ?? null
    
    return <MyExperienceTabContent highlightProjectId={projectId} />
}

export default function ExperiencePage() {
    const { t } = useTranslation()
    return (
        <Suspense fallback={<div className="p-8 text-center">{t('common.loading')}</div>}>
            <ExperienceContent />
        </Suspense>
    )
}
