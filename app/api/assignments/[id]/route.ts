import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> } // 👈 must be Promise
) {
    try {
        const { id } = await context.params // 👈 await params

        const internship = await prisma.internship.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                testAssignmentTitle: true,
                testAssignmentDescription: true,
                testAssignmentDueDate: true,
                company: {
                    select: {
                        name: true,
                    },
                },
            },
        })

        if (!internship) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            id: internship.id,
            title: internship.testAssignmentTitle,
            description: internship.testAssignmentDescription,
            dueDate: internship.testAssignmentDueDate,
            internshipTitle: internship.title,
            companyName: internship.company.name,
        })
    } catch (error) {
        console.error("Error fetching assignment:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
