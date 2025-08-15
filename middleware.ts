import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes
const publicRoutes = createRouteMatcher(['/']);

// Middleware
export default clerkMiddleware(async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();

    // If the route is NOT public and user is not signed in → redirect
    if (!userId && !publicRoutes(req)) {
        return redirectToSignIn();
    }
});

export const config = {
    matcher: [
        // Exclude Next.js internals & static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
