// app/api/saved-internships/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/saved-internships - Get all saved internships for current user
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const savedInternships = await prisma.savedInternship.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                internshipId: true,
                createdAt: true,
                internship: {
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
                        company: { 
                            select: { 
                                id: true, 
                                name: true, 
                                logo: true 
                            } 
                        }
                    }
                }
            }
        })

        return NextResponse.json(savedInternships)
    } catch (error) {
        console.error("GET /api/saved-internships error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// POST /api/saved-internships - Save an internship
export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can save internships" }, { status: 403 })
        }

        const body = await req.json()
        const { internshipId } = body as { internshipId: string }

        if (!internshipId) {
            return NextResponse.json({ error: "Internship ID required" }, { status: 400 })
        }

        // Check if internship exists
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        })

        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 })
        }

        // Check if already saved
        const existing = await prisma.savedInternship.findUnique({
            where: {
                userId_internshipId: {
                    userId: user.id,
                    internshipId
                }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Already saved" }, { status: 400 })
        }

        const saved = await prisma.savedInternship.create({
            data: {
                userId: user.id,
                internshipId
            }
        })

        return NextResponse.json(saved, { status: 201 })
    } catch (error) {
        console.error("POST /api/saved-internships error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// DELETE /api/saved-internships - Remove a saved internship
export async function DELETE(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const body = await req.json()
        const { internshipId } = body as { internshipId: string }

        if (!internshipId) {
            return NextResponse.json({ error: "Internship ID required" }, { status: 400 })
        }

        await prisma.savedInternship.delete({
            where: {
                userId_internshipId: {
                    userId: user.id,
                    internshipId
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE /api/saved-internships error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
