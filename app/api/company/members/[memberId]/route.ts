import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission, DefaultCompanyRole, MemberStatus } from "@prisma/client"
import { canManageRole } from "@/lib/role-permissions"

export const runtime = "nodejs"

interface RouteParams {
  params: Promise<{ memberId: string }>
}

/**
 * GET /api/company/members/[memberId]
 * Get details of a specific member
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the requesting user's company
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const member = await prisma.companyMember.findFirst({
      where: {
        id: memberId,
        companyId: user.companyMembership.companyId,
      },
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
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: member.id,
      userId: member.userId,
      name: member.user.profile?.name || member.user.email,
      email: member.user.email,
      defaultRole: member.defaultRole,
      customRole: member.customRole,
      extraPermissions: member.extraPermissions,
      status: member.status,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      invitedBy: member.invitedBy ? {
        name: member.invitedBy.profile?.name || member.invitedBy.email,
      } : null,
    })
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 })
  }
}

/**
 * PATCH /api/company/members/[memberId]
 * Update a member's role or status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { defaultRole, customRoleId, status } = body

    // Get the requesting user's membership
    const requester = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            customRole: true,
          },
        },
      },
    })

    if (!requester || !requester.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = requester.companyMembership.companyId

    // Get the target member
    const targetMember = await prisma.companyMember.findFirst({
      where: {
        id: memberId,
        companyId,
      },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Check permissions
    const hasChangeRolePermission = await checkPermissionByClerkId(clerkId, companyId, Permission.CHANGE_ROLES)
    if (!hasChangeRolePermission) {
      return NextResponse.json({ error: "You don't have permission to change roles" }, { status: 403 })
    }

    // Check if requester can manage the target's current role
    if (requester.companyMembership.defaultRole && targetMember.defaultRole) {
      if (!canManageRole(requester.companyMembership.defaultRole, targetMember.defaultRole)) {
        return NextResponse.json({ 
          error: "You cannot manage a member with equal or higher role" 
        }, { status: 403 })
      }
    }

    // Cannot change the owner's role (only owner can transfer ownership)
    if (targetMember.defaultRole === DefaultCompanyRole.OWNER && defaultRole !== DefaultCompanyRole.OWNER) {
      return NextResponse.json({ 
        error: "Cannot change owner's role. Use ownership transfer instead." 
      }, { status: 403 })
    }

    // Cannot assign OWNER role directly (must use ownership transfer)
    if (defaultRole === DefaultCompanyRole.OWNER) {
      return NextResponse.json({ 
        error: "Cannot assign owner role directly. Use ownership transfer." 
      }, { status: 403 })
    }

    // Validate role if provided
    if (defaultRole && !Object.values(DefaultCompanyRole).includes(defaultRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Validate custom role if provided
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

    // Update the member
    const updateData: {
      defaultRole?: DefaultCompanyRole
      customRoleId?: string | null
      status?: MemberStatus
    } = {}

    if (defaultRole !== undefined) {
      updateData.defaultRole = defaultRole
      // Clear custom role if setting a default role
      if (defaultRole) {
        updateData.customRoleId = null
      }
    }

    if (customRoleId !== undefined) {
      updateData.customRoleId = customRoleId
      // Clear default role if setting a custom role
      if (customRoleId) {
        // Use type assertion since Prisma schema has DefaultCompanyRole?
        ;(updateData as Record<string, unknown>).defaultRole = null
      }
    }

    if (status !== undefined) {
      if (!Object.values(MemberStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updateData.status = status
    }

    const updatedMember = await prisma.companyMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        customRole: true,
      },
    })

    // Create notification for the member
    await prisma.notification.create({
      data: {
        userId: updatedMember.userId,
        type: "TEAM_ROLE_CHANGED",
        title: "Role Updated",
        message: `Your role has been updated to ${updatedMember.defaultRole || updatedMember.customRole?.name}`,
        link: "/dashboard/company/team",
      },
    })

    return NextResponse.json({
      message: "Member updated successfully",
      member: {
        id: updatedMember.id,
        name: updatedMember.user.profile?.name || updatedMember.user.email,
        email: updatedMember.user.email,
        defaultRole: updatedMember.defaultRole,
        customRole: updatedMember.customRole,
        status: updatedMember.status,
      },
    })
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

/**
 * DELETE /api/company/members/[memberId]
 * Remove a member from the company
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the requesting user's membership
    const requester = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
      },
    })

    if (!requester || !requester.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = requester.companyMembership.companyId

    // Get the target member
    const targetMember = await prisma.companyMember.findFirst({
      where: {
        id: memberId,
        companyId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        company: true,
      },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove yourself
    if (targetMember.userId === requester.id) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 403 })
    }

    // Cannot remove the owner
    if (targetMember.defaultRole === DefaultCompanyRole.OWNER) {
      return NextResponse.json({ error: "Cannot remove the company owner" }, { status: 403 })
    }

    // Check permissions
    const hasRemovePermission = await checkPermissionByClerkId(clerkId, companyId, Permission.REMOVE_MEMBERS)
    if (!hasRemovePermission) {
      return NextResponse.json({ error: "You don't have permission to remove members" }, { status: 403 })
    }

    // Check if requester can manage the target's role
    if (requester.companyMembership.defaultRole && targetMember.defaultRole) {
      if (!canManageRole(requester.companyMembership.defaultRole, targetMember.defaultRole)) {
        return NextResponse.json({ 
          error: "You cannot remove a member with equal or higher role" 
        }, { status: 403 })
      }
    }

    // Delete the member
    await prisma.companyMember.delete({
      where: { id: memberId },
    })

    // Notify the removed member
    await prisma.notification.create({
      data: {
        userId: targetMember.userId,
        type: "TEAM_MEMBER_REMOVED",
        title: "Removed from Company",
        message: `You have been removed from ${targetMember.company.name}`,
        link: "/dashboard",
      },
    })

    return NextResponse.json({
      message: "Member removed successfully",
    })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
