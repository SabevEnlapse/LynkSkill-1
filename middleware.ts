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

    // Create response with proper SEO headers (allowing indexing)
    const response = NextResponse.next();
    
    // Remove any noindex headers and ensure proper indexing for SEO
    response.headers.delete('X-Robots-Tag');
    
    // Set proper SEO-friendly headers
    response.headers.set('X-Robots-Tag', 'index, follow');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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
                const redirectResponse = NextResponse.redirect(new URL("/onboarding", req.url));
                redirectResponse.headers.delete('X-Robots-Tag');
                redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
                return redirectResponse;
            }

            if (role === "COMPANY") {
                const redirectResponse = NextResponse.redirect(new URL("/dashboard/company", req.url));
                redirectResponse.headers.delete('X-Robots-Tag');
                redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
                return redirectResponse;
            }
            const redirectResponse = NextResponse.redirect(new URL("/dashboard/student", req.url));
            redirectResponse.headers.delete('X-Robots-Tag');
            redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
            return redirectResponse;
        }

        return response;
    }

    // ✅ Redirect guests to "/"
    if (!userId && !isPublicRoute(req)) {
        const redirectResponse = NextResponse.redirect(new URL("/", req.url));
        redirectResponse.headers.delete('X-Robots-Tag');
        redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
        return redirectResponse;
    }

    // ✅ Onboarding redirect
    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
    const onboardingComplete =
        onboardingRaw === true || onboardingRaw?.toString() === "true";
    const role = (sessionClaims?.metadata?.role || "")
        .toString()
        .toUpperCase();

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        const redirectResponse = NextResponse.redirect(new URL("/onboarding", req.url));
        redirectResponse.headers.delete('X-Robots-Tag');
        redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
        return redirectResponse;
    }

    // ✅ Role-based route protection
    if (url.pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
        const redirectResponse = NextResponse.redirect(new URL("/dashboard/company", req.url));
        redirectResponse.headers.delete('X-Robots-Tag');
        redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
        return redirectResponse;
    }
    if (url.pathname.startsWith("/dashboard/company") && role !== "COMPANY") {
        const redirectResponse = NextResponse.redirect(new URL("/dashboard/student", req.url));
        redirectResponse.headers.delete('X-Robots-Tag');
        redirectResponse.headers.set('X-Robots-Tag', 'index, follow');
        return redirectResponse;
    }

    // Ensure final response has proper SEO headers
    response.headers.delete('X-Robots-Tag');
    response.headers.set('X-Robots-Tag', 'index, follow');
    return response;
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
