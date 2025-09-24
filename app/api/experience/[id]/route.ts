import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

interface Params {
    params: { id: string }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })
        if (!user || user.role !== "COMPANY") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { status, grade } = body

        const experience = await prisma.experience.findUnique({
            where: { id: params.id },
        })
        if (!experience) return NextResponse.json({ error: "Experience not found" }, { status: 404 })

        if (!user.companies.some((c) => c.id === experience.companyId)) {
            return NextResponse.json({ error: "Not your company’s experience" }, { status: 403 })
        }

        const updated = await prisma.experience.update({
            where: { id: params.id },
            data: {
                status,
                grade: status === "approved" ? grade : null,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }
}
