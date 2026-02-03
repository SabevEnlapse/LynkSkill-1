import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/company/invitations
 * Get pending invitations for the current user
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get pending invitations for this user's email
    const invitations = await prisma.companyInvitation.findMany({
      where: {
        email: user.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
          },
        },
        invitedBy: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedInvitations = invitations.map(inv => ({
      id: inv.id,
      token: inv.token,
      company: {
        id: inv.company.id,
        name: inv.company.name,
        logo: inv.company.logo,
        location: inv.company.location,
      },
      role: inv.role,
      invitedBy: {
        name: inv.invitedBy.profile?.name || inv.invitedBy.email,
      },
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }))

    return NextResponse.json({
      invitations: formattedInvitations,
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}
