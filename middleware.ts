import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
 //public routes
const isPublicRoute = createRouteMatcher([
    "/",
    "/terms",
    "/privacy",
    "/help",
    "/sitemap.xml",
    "/robots.txt",
    "/api/validate-eik(.*)",
    "/api/company/accept-policies(.*)",
    "/api/student/accept-policies(.*)",
    "/api/upload-logo(.*)",
    "/api/cleanup(.*)",
    "/api/public/(.*)",
    "/internships/(.*)",
    "/companies/(.*)",
    "/projects/(.*)",
    "/assignments/(.*)"
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding",
    "/redirect-after-signin",
    "/sign-in",
    "/sign-up",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // Helper function to create SEO-friendly response
    const createSEOResponse = (response: NextResponse) => {
        // Remove any existing noindex headers
        response.headers.delete('X-Robots-Tag');
        
        // Set proper SEO-friendly headers for all pages
        response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        return response;
    };

    // Create response with proper SEO headers (allowing indexing)
    const response = createSEOResponse(NextResponse.next());

    // ✅ Allow Googlebot and other crawlers to access public pages without redirect
    const userAgent = req.headers.get("user-agent") || "";
    if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(userAgent)) {
        return response;
    }

    // ✅ Always allow public APIs and static pages
    if (isPublicRoute(req)) {
        // 👇 Special case: if logged in and visiting "/", redirect to dashboard
        if (url.pathname === "/" && userId) {
            const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
            const onboardingComplete =
                onboardingRaw === true || onboardingRaw?.toString() === "true";
            const role = (sessionClaims?.metadata?.role || "")
                .toString()
                .toUpperCase();

            if (!onboardingComplete) {
                return createSEOResponse(NextResponse.redirect(new URL("/onboarding", req.url)));
            }

            if (role === "COMPANY") {
                return createSEOResponse(NextResponse.redirect(new URL("/dashboard/company", req.url)));
            }
            return createSEOResponse(NextResponse.redirect(new URL("/dashboard/student", req.url)));
        }

        return response;
    }

    // ✅ Redirect guests to "/"
    if (!userId && !isPublicRoute(req)) {
        return createSEOResponse(NextResponse.redirect(new URL("/", req.url)));
    }

    // ✅ Onboarding redirect
    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
    const onboardingComplete =
        onboardingRaw === true || onboardingRaw?.toString() === "true";
    const role = (sessionClaims?.metadata?.role || "")
        .toString()
        .toUpperCase();

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return createSEOResponse(NextResponse.redirect(new URL("/onboarding", req.url)));
    }

    // ✅ Role-based route protection
    if (url.pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
        return createSEOResponse(NextResponse.redirect(new URL("/dashboard/company", req.url)));
    }
    if (url.pathname.startsWith("/dashboard/company") && role !== "COMPANY") {
        return createSEOResponse(NextResponse.redirect(new URL("/dashboard/student", req.url)));
    }

    // Return final response with proper SEO headers
    return response;
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
