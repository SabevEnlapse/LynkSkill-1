// /app/api/get-role/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Apply rate limiting
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`get-role:${clientIp}`, RATE_LIMITS.public)
    
    if (!rateLimit.success) {
        return NextResponse.json(
            { role: null, onboardingComplete: false, error: "Too many requests" },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        )
    }

    try {
        const { clerkId } = await req.json()
        if (!clerkId) {
            return NextResponse.json(
                { role: null, onboardingComplete: false },
                { headers: rateLimitHeaders(rateLimit) }
            )
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { role: true, onboardingComplete: true },
        })

        return NextResponse.json(
            {
                role: user?.role ?? null,
                onboardingComplete: user?.onboardingComplete ?? false,
            },
            { headers: rateLimitHeaders(rateLimit) }
        )
    } catch (error) {
        console.error("get-role error:", error)
        return NextResponse.json(
            { role: null, onboardingComplete: false, error: "Server error" },
            { status: 500, headers: rateLimitHeaders(rateLimit) }
        )
    }
}
