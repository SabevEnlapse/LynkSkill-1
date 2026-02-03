import { NextResponse } from "next/server"
import { validateEIK } from "@/lib/validateEIK"
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit"

export async function GET(req: Request) {
    try {
        // Apply rate limiting
        const clientIp = getClientIp(req)
        const rateLimit = checkRateLimit(`validate-eik:${clientIp}`, RATE_LIMITS.validation)
        
        if (!rateLimit.success) {
            return NextResponse.json(
                { valid: false, error: "Too many requests. Please try again later." },
                { status: 429, headers: rateLimitHeaders(rateLimit) }
            )
        }

        const { searchParams } = new URL(req.url)
        const eik = searchParams.get("eik")

        if (!eik) {
            return NextResponse.json({ valid: false, error: "Missing EIK" }, { status: 400, headers: rateLimitHeaders(rateLimit) })
        }

        if (!/^\d{9,13}$/.test(eik)) {
            return NextResponse.json({ valid: false, eik, error: "Invalid EIK format" }, { status: 200, headers: rateLimitHeaders(rateLimit) })
        }

        const isValid = Boolean(validateEIK(eik))

        return NextResponse.json(
            {
                valid: isValid,
                eik,
                companyName: isValid ? "Company exists (simulated)" : null,
            },
            { status: 200, headers: rateLimitHeaders(rateLimit) },
        )
    } catch (error) {
        console.error("❌ validate-eik API error:", error)
        return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 })
    }
}
