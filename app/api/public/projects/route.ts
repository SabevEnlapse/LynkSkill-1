import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Cache for 4 hours as projects are updated moderately frequently
export const revalidate = 14400

// GET /api/public/projects - Returns approved projects for public showcase
export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            where: {
                // Only include projects from approved applications
                application: {
                    status: "APPROVED"
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                internship: {
                    select: {
                        id: true,
                        title: true,
                        company: {
                            select: {
                                id: true,
                                name: true,
                                logo: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                experiences: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    where: {
                        status: "approved"
                    },
                    take: 1
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(projects)
    } catch (err) {
        console.error("Error fetching public projects:", err)
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }
}