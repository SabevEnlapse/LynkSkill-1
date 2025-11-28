import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 1) Get company user
        const companyUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        })
        if (!companyUser)
            return NextResponse.json({ error: "Company user not found" }, { status: 404 })

        const company = await prisma.company.findFirst({
            where: { ownerId: companyUser.id },
            select: { id: true },
        })
        if (!company)
            return NextResponse.json({ error: "Company not found" }, { status: 404 })

        // 2) Fetch internships + grouped assignments
        const internships = await prisma.internship.findMany({
            where: { companyId: company.id },
            select: {
                id: true,
                title: true,
                testAssignmentTitle: true,
                testAssignmentDescription: true,

                assignments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { name: true } }
                            }
                        },
                        submissions: {
                            select: {
                                id: true,
                                url: true,
                                name: true,
                                size: true,
                                createdAt: true,
                            }
                        },
                        status: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(internships)
    } catch (err) {
        console.error("Error fetching company assignments:", err)
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
            { status: 500 }
        )
    }
}
