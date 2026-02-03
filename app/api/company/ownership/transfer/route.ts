import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { DefaultCompanyRole, MemberStatus } from "@prisma/client"
import crypto from "crypto"

export const runtime = "nodejs"

/**
 * GET /api/company/ownership/transfer
 * Get pending transfer request (if any)
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = user.companyMembership.companyId

    // Get any pending transfer request
    const pendingTransfer = await prisma.ownershipTransferRequest.findFirst({
      where: {
        companyId,
        completedAt: null,
        cancelledAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!pendingTransfer) {
      return NextResponse.json({ pendingTransfer: null })
    }

    // Only show confirmation code to the initiator
    const isInitiator = pendingTransfer.fromUserId === user.id

    return NextResponse.json({
      pendingTransfer: {
        id: pendingTransfer.id,
        from: {
          id: pendingTransfer.fromUserId,
          name: pendingTransfer.fromUser.profile?.name || pendingTransfer.fromUser.email,
        },
        to: {
          id: pendingTransfer.toUserId,
          name: pendingTransfer.toUser.profile?.name || pendingTransfer.toUser.email,
        },
        confirmedOnce: pendingTransfer.confirmedOnce,
        confirmationCode: isInitiator ? pendingTransfer.confirmationCode : undefined,
        expiresAt: pendingTransfer.expiresAt,
        createdAt: pendingTransfer.createdAt,
      },
    })
  } catch (error) {
    console.error("Error fetching transfer request:", error)
    return NextResponse.json({ error: "Failed to fetch transfer request" }, { status: 500 })
  }
}

/**
 * POST /api/company/ownership/transfer
 * Initiate or complete ownership transfer
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, toMemberId, confirmationText, confirmationCode } = body

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            company: true,
          },
        },
        profile: true,
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    // Only owner can transfer ownership
    if (user.companyMembership.defaultRole !== DefaultCompanyRole.OWNER) {
      return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 })
    }

    const companyId = user.companyMembership.companyId

    // Check for existing pending transfer
    const existingTransfer = await prisma.ownershipTransferRequest.findFirst({
      where: {
        companyId,
        completedAt: null,
        cancelledAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (action === "initiate") {
      // STEP 1: Initiate transfer
      if (existingTransfer) {
        return NextResponse.json({ 
          error: "A transfer request is already pending. Cancel it first." 
        }, { status: 400 })
      }

      if (!toMemberId) {
        return NextResponse.json({ error: "Target member ID is required" }, { status: 400 })
      }

      // Get the target member
      const targetMember = await prisma.companyMember.findFirst({
        where: {
          id: toMemberId,
          companyId,
          status: MemberStatus.ACTIVE,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      })

      if (!targetMember) {
        return NextResponse.json({ error: "Target member not found" }, { status: 404 })
      }

      if (targetMember.userId === user.id) {
        return NextResponse.json({ error: "Cannot transfer ownership to yourself" }, { status: 400 })
      }

      // Generate confirmation code
      const code = crypto.randomBytes(4).toString("hex").toUpperCase()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Create transfer request
      const transfer = await prisma.ownershipTransferRequest.create({
        data: {
          companyId,
          fromUserId: user.id,
          toUserId: targetMember.userId,
          confirmationCode: code,
          expiresAt,
        },
      })

      // Notify the target user
      await prisma.notification.create({
        data: {
          userId: targetMember.userId,
          type: "OWNERSHIP_TRANSFER_REQUEST",
          title: "Ownership Transfer Request",
          message: `${user.profile?.name || user.email} wants to transfer company ownership to you`,
          link: "/dashboard/company/team",
        },
      })

      // TODO: Send email notification
      // await sendOwnershipTransferEmail({...})

      return NextResponse.json({
        message: "Transfer initiated. Complete the first confirmation.",
        transfer: {
          id: transfer.id,
          to: {
            name: targetMember.user.profile?.name || targetMember.user.email,
          },
          confirmationCode: code,
          expiresAt,
        },
      })

    } else if (action === "confirm_first") {
      // STEP 2: First confirmation (type the new owner's name/email)
      if (!existingTransfer) {
        return NextResponse.json({ error: "No pending transfer request" }, { status: 404 })
      }

      if (existingTransfer.fromUserId !== user.id) {
        return NextResponse.json({ error: "Only the initiator can confirm" }, { status: 403 })
      }

      if (existingTransfer.confirmedOnce) {
        return NextResponse.json({ error: "First confirmation already done" }, { status: 400 })
      }

      if (!confirmationText) {
        return NextResponse.json({ 
          error: "Please type the new owner's name or email to confirm" 
        }, { status: 400 })
      }

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: existingTransfer.toUserId },
        include: { profile: true },
      })

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 })
      }

      // Verify the confirmation text matches
      const targetName = targetUser.profile?.name?.toLowerCase() || ""
      const targetEmail = targetUser.email.toLowerCase()
      const inputText = confirmationText.toLowerCase().trim()

      if (inputText !== targetName && inputText !== targetEmail) {
        return NextResponse.json({ 
          error: "The name/email you typed doesn't match the target user" 
        }, { status: 400 })
      }

      // Mark as first confirmed
      await prisma.ownershipTransferRequest.update({
        where: { id: existingTransfer.id },
        data: { confirmedOnce: true },
      })

      return NextResponse.json({
        message: "First confirmation complete. Now enter the confirmation code and type 'TRANSFER OWNERSHIP' to complete.",
        confirmationCode: existingTransfer.confirmationCode,
      })

    } else if (action === "confirm_final") {
      // STEP 3: Final confirmation (enter code + type "TRANSFER OWNERSHIP")
      if (!existingTransfer) {
        return NextResponse.json({ error: "No pending transfer request" }, { status: 404 })
      }

      if (existingTransfer.fromUserId !== user.id) {
        return NextResponse.json({ error: "Only the initiator can confirm" }, { status: 403 })
      }

      if (!existingTransfer.confirmedOnce) {
        return NextResponse.json({ error: "Complete first confirmation first" }, { status: 400 })
      }

      if (!confirmationCode || confirmationCode !== existingTransfer.confirmationCode) {
        return NextResponse.json({ error: "Invalid confirmation code" }, { status: 400 })
      }

      if (!confirmationText || confirmationText.toUpperCase() !== "TRANSFER OWNERSHIP") {
        return NextResponse.json({ 
          error: "Please type 'TRANSFER OWNERSHIP' exactly to confirm" 
        }, { status: 400 })
      }

      // Execute the transfer
      await prisma.$transaction(async (tx) => {
        // Get both members
        const currentOwner = await tx.companyMember.findFirst({
          where: {
            companyId,
            userId: user.id,
          },
        })

        const newOwner = await tx.companyMember.findFirst({
          where: {
            companyId,
            userId: existingTransfer.toUserId,
          },
        })

        if (!currentOwner || !newOwner) {
          throw new Error("Members not found")
        }

        // Demote current owner to ADMIN
        await tx.companyMember.update({
          where: { id: currentOwner.id },
          data: { defaultRole: DefaultCompanyRole.ADMIN },
        })

        // Promote new owner to OWNER
        await tx.companyMember.update({
          where: { id: newOwner.id },
          data: { 
            defaultRole: DefaultCompanyRole.OWNER,
            customRoleId: null, // Clear any custom role
          },
        })

        // Update company owner reference
        await tx.company.update({
          where: { id: companyId },
          data: { ownerId: existingTransfer.toUserId },
        })

        // Mark transfer as completed
        await tx.ownershipTransferRequest.update({
          where: { id: existingTransfer.id },
          data: { completedAt: new Date() },
        })

        // Notify both parties
        await tx.notification.create({
          data: {
            userId: existingTransfer.toUserId,
            type: "OWNERSHIP_TRANSFER_COMPLETED",
            title: "You are now the Owner",
            message: "Company ownership has been transferred to you",
            link: "/dashboard/company/team",
          },
        })

        await tx.notification.create({
          data: {
            userId: user.id,
            type: "OWNERSHIP_TRANSFER_COMPLETED",
            title: "Ownership Transferred",
            message: "You have successfully transferred company ownership",
            link: "/dashboard/company/team",
          },
        })
      })

      return NextResponse.json({
        message: "Ownership transferred successfully",
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing ownership transfer:", error)
    return NextResponse.json({ error: "Failed to process transfer" }, { status: 500 })
  }
}
