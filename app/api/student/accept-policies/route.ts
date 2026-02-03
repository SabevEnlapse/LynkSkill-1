// app/api/student/accept-policies/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit"
import { isValidCuid, securityHeaders } from "@/lib/security"

export async function POST(req: NextRequest) {
    // Apply rate limiting
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`student-policies:${clientIp}`, RATE_LIMITS.sensitive)
    
    const headers = {
        ...rateLimitHeaders(rateLimit),
        ...securityHeaders,
    }
    
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers }
        )
    }

    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
        }

        const body = await req.json().catch(() => null)
        if (!body) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers })
        }

        const portfolioId = String(body.portfolioId ?? "").trim()
        if (!portfolioId || portfolioId === "null" || portfolioId === "undefined") {
            return NextResponse.json({ error: "Portfolio ID required" }, { status: 400, headers })
        }

        // Validate ID format
        if (!isValidCuid(portfolioId)) {
            return NextResponse.json({ error: "Invalid portfolio ID format" }, { status: 400, headers })
        }

        // Normalize boolean-like inputs
        const parseBool = (v: unknown) =>
            v === true || v === "true" || v === "1" || v === 1

        const tosAccepted = parseBool(body.tosAccepted)
        const privacyAccepted = parseBool(body.privacyAccepted)

        // Both must be accepted
        if (!tosAccepted || !privacyAccepted) {
            return NextResponse.json(
                { error: "You must accept both Terms of Service and Privacy Policy" },
                { status: 400, headers }
            )
        }

        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { student: true },
        })
        if (!portfolio) {
            return NextResponse.json({ error: "Portfolio not found" }, { status: 404, headers })
        }

        if (!portfolio.student) {
            return NextResponse.json({ error: "Portfolio has no student" }, { status: 500, headers })
        }

        if (portfolio.student.clerkId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403, headers })
        }

        await prisma.user.update({
            where: { id: portfolio.studentId },
            data: {
                tosAccepted,
                privacyAccepted,
            },
        })

        return NextResponse.json({ success: true }, { status: 200, headers })
    } catch (err) {
        console.error("Error updating student policies:", err)
        return NextResponse.json({ error: "Failed to update policies" }, { status: 500 })
    }
}