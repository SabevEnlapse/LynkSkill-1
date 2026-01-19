// app/api/projects/cleanup/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
    try {
        // optional: restrict to admin or company owner — ако искаш, може да провериш user role
        // const { userId } = await auth(); if (!userId) return NextResponse.json(...)

        const now = new Date()

        // 1) find expired projects (minimal select)
        const expiredProjects = await prisma.project.findMany({
            where: {
                internship: { testAssignmentDueDate: { lt: now } },
            },
            select: { id: true, internshipId: true, studentId: true },
        })

        if (expiredProjects.length === 0) {
            return NextResponse.json({ deleted: 0 })
        }

        // 2) gather unique internship/student pairs and query TestSubmission
        const internshipIds = Array.from(new Set(expiredProjects.map((p) => p.internshipId)))
        const studentIds = Array.from(new Set(expiredProjects.map((p) => p.studentId)))

        const submissions = await prisma.testSubmission.findMany({
            where: {
                internshipId: { in: internshipIds },
                studentId: { in: studentIds },
            },
            select: { internshipId: true, studentId: true },
        })

        const submittedPairs = new Set(submissions.map((s) => `${s.internshipId}|${s.studentId}`))

        // 3) pick ids to delete
        const idsToDelete = expiredProjects
            .filter((p) => !submittedPairs.has(`${p.internshipId}|${p.studentId}`))
            .map((p) => p.id)

        // 4) delete many if needed
        let deletedCount = 0
        if (idsToDelete.length > 0) {
            const res = await prisma.project.deleteMany({ where: { id: { in: idsToDelete } } })
            deletedCount = res.count
        }

        return NextResponse.json({ deleted: deletedCount })
    } catch (err) {
        console.error("Cleanup failed:", err)
        return NextResponse.json({ error: "Cleanup failed", details: String(err) }, { status: 500 })
    }
}
