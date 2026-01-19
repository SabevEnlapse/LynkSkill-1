import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Get a specific review
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        profile: { select: { name: true } }
                    }
                },
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
            }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        return NextResponse.json(review)
    } catch (error) {
        console.error("Error fetching review:", error)
        return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
    }
}

// PATCH - Update a review
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const review = await prisma.review.findUnique({
            where: { id }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        if (review.studentId !== user.id) {
            return NextResponse.json({ error: "You can only edit your own reviews" }, { status: 403 })
        }

        const { rating, title, content } = await req.json()

        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
        }

        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                ...(rating && { rating }),
                ...(title && { title }),
                ...(content && { content })
            }
        })

        return NextResponse.json(updatedReview)
    } catch (error) {
        console.error("Error updating review:", error)
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const review = await prisma.review.findUnique({
            where: { id }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        if (review.studentId !== user.id) {
            return NextResponse.json({ error: "You can only delete your own reviews" }, { status: 403 })
        }

        await prisma.review.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting review:", error)
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
    }
}
