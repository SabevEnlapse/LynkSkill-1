// app/api/student/accept-policies/route.ts
        import { type NextRequest, NextResponse } from "next/server"
        import { prisma } from "@/lib/prisma"
        import { auth } from "@clerk/nextjs/server"

        export async function POST(req: NextRequest) {
            try {
                const { userId } = await auth()
                if (!userId) {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                }

                const body = await req.json().catch(() => null)
                if (!body) {
                    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
                }

                const portfolioId = String(body.portfolioId ?? "").trim()
                if (!portfolioId || portfolioId === "null" || portfolioId === "undefined") {
                    return NextResponse.json({ error: "Portfolio ID required" }, { status: 400 })
                }

                // normalize boolean-like inputs: true | "true" | "1" -> true
                const parseBool = (v: unknown) =>
                    v === true || v === "true" || v === "1" || v === 1

                const tosAccepted = parseBool(body.tosAccepted)
                const privacyAccepted = parseBool(body.privacyAccepted)

                const portfolio = await prisma.portfolio.findUnique({
                    where: { id: portfolioId },
                    include: { student: true },
                })
                if (!portfolio) {
                    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
                }

                if (!portfolio.student) {
                    return NextResponse.json({ error: "Portfolio has no student" }, { status: 500 })
                }

                if (portfolio.student.clerkId !== userId) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
                }

                const updated = await prisma.user.update({
                    where: { id: portfolio.studentId },
                    data: {
                        tosAccepted,
                        privacyAccepted,
                    },
                })

                return NextResponse.json({ success: true, user: updated }, { status: 200 })
            } catch (err) {
                console.error("Error updating student policies:", err)
                return NextResponse.json({ error: "Failed to update policies" }, { status: 500 })
            }
        }