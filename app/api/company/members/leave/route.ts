import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { DefaultCompanyRole } from "@prisma/client"

export const runtime = "nodejs"

/**
 * POST /api/company/members/leave
 * Leave the current company (non-owners only)
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const membership = user.companyMembership
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "You are not a member of any company" },
        { status: 404 }
      )
    }

    // Owners cannot leave — they must transfer ownership first
    if (membership.defaultRole === DefaultCompanyRole.OWNER) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Owners cannot leave the company. You must transfer ownership to another member first.",
        },
        { status: 400 }
      )
    }

    const companyName = membership.company?.name ?? "the company"

    // Delete the membership
    await prisma.companyMember.delete({
      where: { id: membership.id },
    })

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "GENERAL",
        title: "Left Company",
        message: `You have successfully left ${companyName}`,
        link: "/dashboard",
      },
    })

    return NextResponse.json({
      success: true,
      message: "You have left the company successfully",
    })
  } catch (error) {
    console.error("Error leaving company:", error)
    return NextResponse.json(
      { success: false, error: "Failed to leave company" },
      { status: 500 }
    )
  }
}
