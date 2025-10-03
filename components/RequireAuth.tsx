// "use client"
//
// import type React from "react"
//
// import { useUser } from "@clerk/nextjs"
// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
//
// export default function RequireAuth({ children }: { children: React.ReactNode }) {
//     const [mounted, setMounted] = useState(false)
//     const { isSignedIn, isLoaded } = useUser()
//     const router = useRouter()
//
//     useEffect(() => {
//         setMounted(true)
//     }, [])
//
//     useEffect(() => {
//         if (!mounted || !isLoaded) return
//
//         if (!isSignedIn) {
//             router.replace("/")
//         }
//     }, [mounted, isLoaded, isSignedIn, router])
//
//     if (!mounted || !isLoaded) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <div className="flex items-center gap-2">
//                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
//                     <span className="text-muted-foreground">Loading...</span>
//                 </div>
//             </div>
//         )
//     }
//
//     if (!isSignedIn) {
//         return null
//     }
//
//     return <>{children}</>
// }
