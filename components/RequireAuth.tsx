"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!isLoaded) return
        if (!isSignedIn) {
            router.replace("/") // force redirect
        }
    }, [isLoaded, isSignedIn, router])

    if (!isLoaded) return null
    if (!isSignedIn) return null

    return <>{children}</>
}
