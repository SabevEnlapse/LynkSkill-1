import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const companyUser = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!companyUser) return NextResponse.json({ error: "Company user not found" }, { status: 404 })

        // Find the company that belongs to this user
        const company = await prisma.company.findFirst({ where: { ownerId: companyUser.id } })
        if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

        // Get all internships of this company
        const internships = await prisma.internship.findMany({
            where: { companyId: company.id },
            select: { id: true },
        })
        const internshipIds = internships.map((i) => i.id)

        // Fetch applications for these internships
        const applications = await prisma.application.findMany({
            where: { internshipId: { in: internshipIds } },
            include: {
                internship: true,
                student: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(applications)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to fetch company applications" }, { status: 500 })
    }
}
