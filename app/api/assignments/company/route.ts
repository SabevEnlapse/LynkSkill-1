import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Permission } from "@prisma/client"
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions"

export async function GET() {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Get membership and check permissions
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership)
            return NextResponse.json({ error: "Company membership not found" }, { status: 404 })

        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.CREATE_ASSIGNMENTS
        )
        if (!hasPermission)
            return NextResponse.json({ error: "You don't have permission to view assignments" }, { status: 403 })

        // Fetch internships + grouped assignments for this company
        const internships = await prisma.internship.findMany({
            where: { companyId: membership.companyId },
            select: {
                id: true,
                title: true,
                testAssignmentTitle: true,
                testAssignmentDescription: true,

                assignments: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        dueDate: true,
                        createdAt: true,

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
                        }
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
