import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET /api/projects/approved?companyId=xxx - Returns only projects from APPROVED applications
export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
        })

        if (!student || student.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 })
        }

        // Get companyId from query params
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get("companyId")

        if (!companyId) {
            return NextResponse.json({ error: "companyId is required" }, { status: 400 })
        }

        // Find all APPROVED applications for this student with this company
        const approvedApplications = await prisma.application.findMany({
            where: {
                studentId: student.id,
                status: "APPROVED",
                internship: {
                    companyId: companyId,
                },
            },
            include: {
                internship: true,
            },
        })

        // Get the application IDs
        const applicationIds = approvedApplications.map((app) => app.id)

        // Find projects created from these approved applications
        const projects = await prisma.project.findMany({
            where: {
                applicationId: { in: applicationIds },
                companyId: companyId,
                studentId: student.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                companyId: true,
                internshipId: true,
                applicationId: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(projects)
    } catch (err) {
        console.error("GET /api/projects/approved error:", err)
        return NextResponse.json({ error: "Failed to fetch approved projects", details: String(err) }, { status: 500 })
    }
}
