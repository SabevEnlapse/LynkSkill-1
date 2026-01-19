import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Zod schema for review creation
const createReviewSchema = z.object({
    applicationId: z.string().min(1, "Application ID is required"),
    rating: z.number()
        .int("Rating must be a whole number")
        .min(1, "Rating must be at least 1 star")
        .max(5, "Rating cannot exceed 5 stars"),
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title cannot exceed 100 characters"),
    content: z.string()
        .min(10, "Review must be at least 10 characters")
        .max(2000, "Review cannot exceed 2000 characters")
})

// GET - Fetch reviews (for a company or by current user)
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get("companyId")

        if (companyId) {
            // Get all reviews for a company
            const reviews = await prisma.review.findMany({
                where: { companyId },
                include: {
                    student: {
                        select: {
                            id: true,
                            profile: { select: { name: true } }
                        }
                    },
                    application: {
                        select: {
                            internship: {
                                select: { title: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            })

            // Calculate average rating
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0

            return NextResponse.json({ reviews, avgRating, totalReviews: reviews.length })
        }

        // Get current user's reviews
        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const reviews = await prisma.review.findMany({
            where: { studentId: user.id },
            include: {
                company: {
                    select: { id: true, name: true, logo: true }
                },
                application: {
                    select: {
                        internship: {
                            select: { title: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(reviews)
    } catch (error) {
        console.error("Error fetching reviews:", error)
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }
}

// POST - Create a new review
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can leave reviews" }, { status: 403 })
        }

        const body = await req.json()
        
        // Validate with Zod
        const validation = createReviewSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: validation.error.issues[0].message 
            }, { status: 400 })
        }

        const { applicationId, rating, title, content } = validation.data

        // Get the application and verify ownership + approval
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    select: { companyId: true }
                },
                review: true
            }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (application.studentId !== user.id) {
            return NextResponse.json({ error: "You can only review your own applications" }, { status: 403 })
        }

        if (application.status !== "APPROVED") {
            return NextResponse.json({ error: "You can only review approved applications" }, { status: 403 })
        }

        if (application.review) {
            return NextResponse.json({ error: "You have already reviewed this application" }, { status: 400 })
        }

        const review = await prisma.review.create({
            data: {
                companyId: application.internship.companyId,
                studentId: user.id,
                applicationId,
                rating,
                title,
                content
            },
            include: {
                company: {
                    select: { id: true, name: true }
                }
            }
        })

        return NextResponse.json(review, { status: 201 })
    } catch (error) {
        console.error("Error creating review:", error)
        return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }
}
