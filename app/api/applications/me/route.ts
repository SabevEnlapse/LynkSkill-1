// app/api/applications/me/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!student)
            return NextResponse.json({ error: "Student not found" }, { status: 404 })

        // Cleanup moved INSIDE the function and SAFE
        await prisma.application.deleteMany({
            where: {
                internship: {
                    testAssignmentDueDate: { lt: new Date() }
                }
            }
        })

        // Main query (light, minimal selection)
        const applications = await prisma.application.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                internshipId: true,
                internship: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        paid: true,
                        salary: true,
                        applicationStart: true,
                        applicationEnd: true,
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

        return NextResponse.json(applications)
    } catch (err) {
        console.error("GET /api/applications/me error:", err)
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        )
    }
}
