import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Cache for 6 hours as company data changes less frequently
export const revalidate = 21600

// GET /api/public/companies - Returns all companies with active internships
export async function GET() {
    try {
        const companies = await prisma.company.findMany({
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
                name: true,
                description: true,
                location: true,
                website: true,
                logo: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        internships: {
                            where: {
                                applicationStart: {
                                    lte: new Date()
                                },
                                applicationEnd: {
                                    gte: new Date()
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(companies)
    } catch (err) {
        console.error("Error fetching public companies:", err)
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
    }
}