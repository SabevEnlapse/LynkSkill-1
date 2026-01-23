import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "images.clerk.dev",
            },
            {
                protocol: "https",
                hostname: "fucfjfxmhatybotfuask.supabase.co",
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb", // allow up to 50MB uploads
        },
    },
    // Cache configuration for SEO optimization
    async headers() {
        return [
            {
                source: '/sitemap.xml',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                ],
            },
            {
                source: '/robots.txt',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, s-maxage=86400',
                    },
                ],
            },
            {
                source: '/api/public/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
