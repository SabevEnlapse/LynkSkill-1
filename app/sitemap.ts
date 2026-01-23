import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

interface SitemapEntry {
    url: string
    lastModified?: string | Date
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lynkskill.net'
    
    // Fetch dynamic data directly from database
    const [internships, companies, projects] = await Promise.all([
        // Get active internships
        prisma.internship.findMany({
            where: {
                applicationStart: {
                    lte: new Date()
                },
                applicationEnd: {
                    gte: new Date()
                }
            },
            select: {
                id: true,
                updatedAt: true
            }
        }),
        // Get companies with active internships
        prisma.company.findMany({
            where: {
                internships: {
                    some: {
                        applicationStart: {
                            lte: new Date()
                        },
                        applicationEnd: {
                            gte: new Date()
                        }
                    }
                }
            },
            select: {
                id: true,
                updatedAt: true
            }
        }),
        // Get approved projects
        prisma.project.findMany({
            where: {
                application: {
                    status: "APPROVED"
                }
            },
            select: {
                id: true,
                updatedAt: true
            }
        })
    ])

    // Static pages with appropriate SEO attributes
    const staticPages: SitemapEntry[] = [
        // --- Core pages (Highest Priority) ---
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        
        // --- Legal pages (Lowest Priority) ---
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/onboarding`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        }
    ]

    // Dynamic pages for internships
    const internshipPages = internships.map((internship): SitemapEntry => ({
        url: `${baseUrl}/internships/${internship.id}`,
        lastModified: internship.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    // Dynamic pages for companies
    const companyPages = companies.map((company): SitemapEntry => ({
        url: `${baseUrl}/companies/${company.id}`,
        lastModified: company.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    // Dynamic pages for projects
    const projectPages = projects.map((project): SitemapEntry => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: project.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
    }))

    // Combine all pages
    return [
        ...staticPages,
        ...internshipPages,
        ...companyPages,
        ...projectPages
    ]
}
