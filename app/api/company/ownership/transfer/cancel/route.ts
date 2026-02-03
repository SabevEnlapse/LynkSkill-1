import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { DefaultCompanyRole } from "@prisma/client"

export const runtime = "nodejs"

/**
 * POST /api/company/ownership/transfer/cancel
 * Cancel a pending ownership transfer request
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    // Only owner can cancel transfer
    if (user.companyMembership.defaultRole !== DefaultCompanyRole.OWNER) {
      return NextResponse.json({ error: "Only the owner can cancel the transfer" }, { status: 403 })
    }

    const companyId = user.companyMembership.companyId

    // Find pending transfer
    const pendingTransfer = await prisma.ownershipTransferRequest.findFirst({
      where: {
        companyId,
        completedAt: null,
        cancelledAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!pendingTransfer) {
      return NextResponse.json({ error: "No pending transfer request" }, { status: 404 })
    }

    // Cancel the transfer
    await prisma.$transaction(async (tx) => {
      await tx.ownershipTransferRequest.update({
        where: { id: pendingTransfer.id },
        data: { cancelledAt: new Date() },
      })

      // Notify the target user
      await tx.notification.create({
        data: {
          userId: pendingTransfer.toUserId,
          type: "OWNERSHIP_TRANSFER_COMPLETED",
          title: "Transfer Cancelled",
          message: "The ownership transfer request has been cancelled",
          link: "/dashboard/company/team",
        },
      })
    })

    return NextResponse.json({
      message: "Transfer request cancelled",
    })
  } catch (error) {
    console.error("Error cancelling transfer:", error)
    return NextResponse.json({ error: "Failed to cancel transfer" }, { status: 500 })
  }
}
