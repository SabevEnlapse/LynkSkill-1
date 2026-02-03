// lib/rate-limit.ts
// Simple in-memory rate limiter for API routes
// Note: For production at scale, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
    count: number
    resetTime: number
}

// Store rate limit entries in memory (per-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    limit: number
    /** Time window in seconds */
    windowSeconds: number
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    resetTime: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000
    const resetTime = now + windowMs

    const existing = rateLimitStore.get(identifier)

    // If no existing entry or window has expired, create new entry
    if (!existing || existing.resetTime < now) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime,
        })
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            resetTime,
        }
    }

    // Increment count
    existing.count++

    // Check if over limit
    if (existing.count > config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            resetTime: existing.resetTime,
        }
    }

    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - existing.count,
        resetTime: existing.resetTime,
    }
}

/**
 * Get client IP address from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIp(request: Request): string {
    // Check common proxy headers
    const forwardedFor = request.headers.get("x-forwarded-for")
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(",")[0].trim()
    }

    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
        return realIp
    }

    // Vercel-specific header
    const vercelIp = request.headers.get("x-vercel-forwarded-for")
    if (vercelIp) {
        return vercelIp.split(",")[0].trim()
    }

    // Cloudflare header
    const cfIp = request.headers.get("cf-connecting-ip")
    if (cfIp) {
        return cfIp
    }

    // Fallback
    return "unknown"
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
    }
}

// Default rate limit configurations for different API types
export const RATE_LIMITS = {
    // Public APIs - more restrictive
    public: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
    // Authenticated APIs - less restrictive
    authenticated: { limit: 100, windowSeconds: 60 } as RateLimitConfig,
    // Validation APIs (like EIK validation) - moderate
    validation: { limit: 20, windowSeconds: 60 } as RateLimitConfig,
    // Sensitive operations (login, signup attempts) - very restrictive
    sensitive: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
} as const
