import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit"
import { isValidCuid, securityHeaders } from "@/lib/security"

export async function POST(req: NextRequest) {
    // Apply rate limiting
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`company-policies:${clientIp}`, RATE_LIMITS.sensitive)
    
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

        const companyId = String(body.companyId ?? "").trim()
        if (!companyId || companyId === "null" || companyId === "undefined") {
            return NextResponse.json({ error: "Company ID required" }, { status: 400, headers })
        }

        // Validate ID format
        if (!isValidCuid(companyId)) {
            return NextResponse.json({ error: "Invalid company ID format" }, { status: 400, headers })
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

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { owner: true },
        })

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404, headers })
        }

        if (company.owner.clerkId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403, headers })
        }

        await prisma.company.update({
            where: { id: companyId },
            data: {
                tosAccepted,
                privacyAccepted,
            },
        })

        return NextResponse.json({ success: true }, { status: 200, headers })
    } catch (err) {
        console.error("Error updating company policies:", err)
        return NextResponse.json({ error: "Failed to update policies" }, { status: 500 })
    }
}
