import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission, DefaultCompanyRole, MemberStatus } from "@prisma/client"
import crypto from "crypto"

export const runtime = "nodejs"

/**
 * Helper: Ensure owner has a CompanyMember record
 * This handles migration for existing companies created before the role system
 */
async function ensureOwnerMembership(userId: string, companyId: string) {
  const existingMembership = await prisma.companyMember.findUnique({
    where: { userId },
  })

  if (!existingMembership) {
    // Create owner membership for existing company owner
    await prisma.companyMember.create({
      data: {
        userId,
        companyId,
        defaultRole: DefaultCompanyRole.OWNER,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
    })
  }

  return existingMembership
}

/**
 * GET /api/company/members
 * List all members of the user's company
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user and their company
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            company: true,
          },
        },
        companies: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If user doesn't have membership but owns a company, create membership
    let companyId = user.companyMembership?.companyId

    if (!companyId && user.companies.length > 0) {
      const ownedCompanyId = user.companies[0].id
      await ensureOwnerMembership(user.id, ownedCompanyId)
      companyId = ownedCompanyId
    }

    if (!companyId) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    // Get all members of the company
    const members = await prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        customRole: true,
        invitedBy: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [
        { defaultRole: "asc" },
        { createdAt: "asc" },
      ],
    })

    // Format response
    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      name: member.user.profile?.name || member.user.email,
      email: member.user.email,
      defaultRole: member.defaultRole,
      customRole: member.customRole ? {
        id: member.customRole.id,
        name: member.customRole.name,
        color: member.customRole.color,
      } : null,
      extraPermissions: member.extraPermissions,
      status: member.status,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      invitedBy: member.invitedBy ? {
        name: member.invitedBy.profile?.name || member.invitedBy.email,
      } : null,
    }))

    return NextResponse.json({
      members: formattedMembers,
      companyId,
    })
  } catch (error) {
    console.error("Error fetching company members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

/**
 * POST /api/company/members
 * Invite a new member to the company
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, role, customRoleId } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Get inviter and their company
    const inviter = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!inviter || !inviter.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = inviter.companyMembership.companyId

    // Check if inviter has permission to invite members
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.INVITE_MEMBERS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to invite members" }, { status: 403 })
    }

    // Check if the email already belongs to a company member
    const existingUser = await prisma.user.findFirst({
      where: { email },
      include: {
        companyMembership: true,
      },
    })

    if (existingUser?.companyMembership) {
      return NextResponse.json({ 
        error: "This user is already a member of a company" 
      }, { status: 400 })
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.companyInvitation.findFirst({
      where: {
        email,
        companyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ 
        error: "An invitation has already been sent to this email" 
      }, { status: 400 })
    }

    // Validate role
    const selectedRole = role as DefaultCompanyRole
    if (role && !Object.values(DefaultCompanyRole).includes(selectedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // If custom role is specified, verify it exists and belongs to this company
    if (customRoleId) {
      const customRole = await prisma.companyCustomRole.findFirst({
        where: {
          id: customRoleId,
          companyId,
        },
      })
      if (!customRole) {
        return NextResponse.json({ error: "Custom role not found" }, { status: 400 })
      }
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const invitation = await prisma.companyInvitation.create({
      data: {
        companyId,
        email,
        role: selectedRole || DefaultCompanyRole.VIEWER,
        customRoleId: customRoleId || null,
        token,
        invitedById: inviter.id,
        expiresAt,
      },
      include: {
        company: true,
      },
    })

    // If user exists in our system, also create a notification
    if (existingUser) {
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          type: "TEAM_INVITATION",
          title: "Company Team Invitation",
          message: `You've been invited to join ${invitation.company.name} as ${role || "Viewer"}`,
          link: `/dashboard/company/invitations?token=${token}`,
        },
      })
    }

    // TODO: Send email invitation using your email service
    // await sendInvitationEmail({
    //   to: email,
    //   companyName: invitation.company.name,
    //   inviterName: inviter.profile?.name || inviter.email,
    //   role: selectedRole || DefaultCompanyRole.VIEWER,
    //   token,
    //   expiresAt,
    // })

    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error inviting member:", error)
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
  }
}
