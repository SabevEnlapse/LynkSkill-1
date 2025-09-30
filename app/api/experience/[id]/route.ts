import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// PATCH /api/experience/[id]
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ✅ get Clerk user
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params // 👈 params is already an object

        // ✅ find user with companies
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })

        if (!user || user.role !== "COMPANY") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // ✅ parse body
        const body = await req.json()
        const { status, grade } = body as { status: string; grade?: number }

        // ✅ find experience
        const experience = await prisma.experience.findUnique({
            where: { id },
        })

        if (!experience) {
            return NextResponse.json({ error: "Experience not found" }, { status: 404 })
        }

        // ✅ check ownership
        if (!user.companies.some((c) => c.id === experience.companyId)) {
            return NextResponse.json({ error: "Not your company’s experience" }, { status: 403 })
        }

        // ✅ require grade if approving
        if (status === "approved" && (grade === null || grade === undefined)) {
            return NextResponse.json({ error: "Grade is required when approving" }, { status: 400 })
        }

        // ✅ update experience
        const updated = await prisma.experience.update({
            where: { id },
            data: {
                status,
                grade: status === "approved" ? grade : null,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH /experience/[id] error:", error)
        return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }
}
