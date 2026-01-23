import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Cache for 1 hour to improve performance
export const revalidate = 3600

// GET /api/public/internships - Returns all approved internships for public access
export async function GET() {
    try {
        const internships = await prisma.internship.findMany({
            where: {
                // Only include internships that are currently accepting applications
                applicationStart: {
                    lte: new Date()
                },
                applicationEnd: {
                    gte: new Date()
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                paid: true,
                salary: true,
                skills: true,
                applicationStart: true,
                applicationEnd: true,
                createdAt: true,
                updatedAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        location: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(internships)
    } catch (err) {
        console.error("Error fetching public internships:", err)
        return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 })
    }
}