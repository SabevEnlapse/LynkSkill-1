// app/api/internships/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Create internship (for Company)
export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    })
    if (!user || user.role !== "COMPANY") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const internship = await prisma.internship.create({
        data: {
            companyId: user.id,
            title: body.title,
            description: body.description,
            location: body.location,
            qualifications: body.qualifications || null,
            paid: body.paid,
            salary: body.paid ? body.salary : null,
        },
    })

    return NextResponse.json(internship)
}

// Get internships (for Company & Student)
export async function GET() {
    const { userId } = await auth()

    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    })
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const internships =
        user.role === "COMPANY"
            ? await prisma.internship.findMany({
                where: { companyId: user.id },
                orderBy: { createdAt: "desc" },
            })
            : await prisma.internship.findMany({
                orderBy: { createdAt: "desc" },
            })

    return NextResponse.json(internships)
}
