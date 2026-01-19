// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

// GET - List all conversations for current user
export async function GET() {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        let conversations

        if (user.role === "STUDENT") {
            conversations = await prisma.conversation.findMany({
                where: { studentId: user.id },
                include: {
                    application: {
                        include: {
                            internship: {
                                select: { id: true, title: true }
                            }
                        }
                    },
                    company: {
                        select: { id: true, name: true, logo: true }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    },
                    _count: {
                        select: {
                            messages: {
                                where: { read: false, senderType: "COMPANY" }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: "desc" }
            })
        } else {
            // Company user - find their company first
            const company = await prisma.company.findFirst({
                where: { ownerId: user.id },
                select: { id: true }
            })

            if (!company) {
                return NextResponse.json({ error: "Company not found" }, { status: 404 })
            }

            conversations = await prisma.conversation.findMany({
                where: { companyId: company.id },
                include: {
                    application: {
                        include: {
                            internship: {
                                select: { id: true, title: true }
                            }
                        }
                    },
                    student: {
                        select: { 
                            id: true, 
                            email: true,
                            profile: { select: { name: true } }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    },
                    _count: {
                        select: {
                            messages: {
                                where: { read: false, senderType: "STUDENT" }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: "desc" }
            })
        }

        return NextResponse.json(conversations)
    } catch (error) {
        console.error("Error fetching conversations:", error)
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }
}

// POST - Create a new conversation or get existing one for an application
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { applicationId } = await req.json()

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get the application with all related data
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    include: { company: true }
                },
                student: {
                    include: {
                        assignments: {
                            where: { internshipId: applicationId },
                            include: { submissions: true }
                        }
                    }
                },
                conversation: true
            }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        // Check if user is authorized (either the student or the company owner)
        const isStudent = user.id === application.studentId
        const isCompanyOwner = user.id === application.internship.company.ownerId

        if (!isStudent && !isCompanyOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Check if application is approved
        if (application.status !== "APPROVED") {
            return NextResponse.json({ 
                error: "Messaging is only available for approved applications" 
            }, { status: 403 })
        }

        // Check if assignment was required and submitted
        const assignmentRequired = Boolean(application.internship.testAssignmentTitle)
        if (assignmentRequired) {
            // Get assignments for this student and internship
            const assignments = await prisma.assignment.findMany({
                where: {
                    internshipId: application.internshipId,
                    studentId: application.studentId
                },
                include: { submissions: true }
            })

            const hasSubmittedAssignment = assignments.some(a => a.submissions.length > 0)
            
            if (!hasSubmittedAssignment) {
                return NextResponse.json({ 
                    error: "Student must submit the required assignment before messaging" 
                }, { status: 403 })
            }
        }

        // Return existing conversation or create new one
        if (application.conversation) {
            return NextResponse.json(application.conversation)
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                applicationId: application.id,
                studentId: application.studentId,
                companyId: application.internship.companyId
            }
        })

        return NextResponse.json(conversation, { status: 201 })
    } catch (error) {
        console.error("Error creating conversation:", error)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }
}
