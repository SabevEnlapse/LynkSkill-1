import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission, DefaultCompanyRole } from "@prisma/client"
import { canManageRole } from "@/lib/role-permissions"

export const runtime = "nodejs"

interface RouteParams {
  params: Promise<{ memberId: string }>
}

/**
 * GET /api/company/members/[memberId]/permissions
 * Get a member's extra permissions
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
      select: {
        id: true,
        extraPermissions: true,
        defaultRole: true,
        customRole: {
          select: {
            permissions: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({
      memberId: member.id,
      extraPermissions: member.extraPermissions,
      defaultRole: member.defaultRole,
      customRolePermissions: member.customRole?.permissions || [],
    })
  } catch (error) {
    console.error("Error fetching member permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

/**
 * PATCH /api/company/members/[memberId]/permissions
 * Update a member's extra permissions
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { permissions } = body as { permissions: Permission[] }

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 })
    }

    // Validate all permissions are valid enum values
    const validPermissions = Object.values(Permission)
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json({ error: `Invalid permission: ${perm}` }, { status: 400 })
      }
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

    // Check if requester has permission to delegate permissions
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.DELEGATE_PERMISSIONS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to delegate permissions" }, { status: 403 })
    }

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

    // Cannot modify owner's permissions
    if (targetMember.defaultRole === DefaultCompanyRole.OWNER) {
      return NextResponse.json({ 
        error: "Cannot modify owner's permissions" 
      }, { status: 403 })
    }

    // Check if requester can manage the target's role
    if (requester.companyMembership.defaultRole && targetMember.defaultRole) {
      if (!canManageRole(requester.companyMembership.defaultRole, targetMember.defaultRole)) {
        return NextResponse.json({ 
          error: "You cannot modify permissions for a member with equal or higher role" 
        }, { status: 403 })
      }
    }

    // Cannot grant OWNER-only permissions to non-owners
    const ownerOnlyPermissions: Permission[] = [
      Permission.DELETE_COMPANY,
      Permission.TRANSFER_OWNERSHIP,
    ]
    
    for (const perm of permissions) {
      if (ownerOnlyPermissions.includes(perm as Permission)) {
        return NextResponse.json({ 
          error: `Cannot grant ${perm} - this permission is reserved for the owner` 
        }, { status: 403 })
      }
    }

    // Update the member's extra permissions
    const updatedMember = await prisma.companyMember.update({
      where: { id: memberId },
      data: {
        extraPermissions: permissions,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    })

    // Notify the member
    await prisma.notification.create({
      data: {
        userId: updatedMember.userId,
        type: "TEAM_ROLE_CHANGED",
        title: "Permissions Updated",
        message: "Your permissions have been updated",
        link: "/dashboard/company/team",
      },
    })

    return NextResponse.json({
      message: "Permissions updated successfully",
      member: {
        id: updatedMember.id,
        name: updatedMember.user.profile?.name || updatedMember.user.email,
        extraPermissions: updatedMember.extraPermissions,
      },
    })
  } catch (error) {
    console.error("Error updating permissions:", error)
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
