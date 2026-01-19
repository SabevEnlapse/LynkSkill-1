// app/api/applications/withdraw/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/applications/withdraw - Withdraw a pending application
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
            return NextResponse.json({ error: "Only students can withdraw applications" }, { status: 403 })
        }

        const body = await req.json()
        const { applicationId } = body as { applicationId: string }

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 })
        }

        // Find the application
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    select: { title: true }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        // Verify ownership
        if (application.studentId !== user.id) {
            return NextResponse.json({ error: "Not your application" }, { status: 403 })
        }

        // Only pending applications can be withdrawn
        if (application.status !== "PENDING") {
            return NextResponse.json({ 
                error: `Cannot withdraw ${application.status.toLowerCase()} application` 
            }, { status: 400 })
        }

        // Delete any assignments related to this application
        await prisma.assignment.deleteMany({
            where: {
                internshipId: application.internshipId,
                studentId: user.id
            }
        })

        // Delete the application
        await prisma.application.delete({
            where: { id: applicationId }
        })

        return NextResponse.json({ 
            success: true,
            message: `Application to "${application.internship.title}" has been withdrawn`
        })
    } catch (error) {
        console.error("POST /api/applications/withdraw error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
