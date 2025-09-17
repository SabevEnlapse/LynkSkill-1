import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { internshipId } = await req.json();
        if (!internshipId) return NextResponse.json({ error: "internshipId is required" }, { status: 400 });

        const student = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

        const application = await prisma.application.create({
            data: {
                studentId: student.id,
                internshipId,
            },
            include: { internship: { include: { company: true } } },
        });

        return NextResponse.json(application, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
    }
}
