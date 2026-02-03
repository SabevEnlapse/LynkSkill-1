import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission, DefaultCompanyRole } from "@prisma/client"
import { DEFAULT_ROLE_PERMISSIONS, ROLE_DISPLAY_INFO } from "@/lib/role-permissions"

export const runtime = "nodejs"

/**
 * GET /api/company/roles
 * Get all roles (default + custom) for the company
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
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = user.companyMembership.companyId

    // Get custom roles for this company
    const customRoles = await prisma.companyCustomRole.findMany({
      where: { companyId },
      include: {
        createdBy: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Format default roles
    const defaultRoles = Object.values(DefaultCompanyRole).map(role => ({
      type: "default" as const,
      id: role,
      name: ROLE_DISPLAY_INFO[role].label,
      description: ROLE_DISPLAY_INFO[role].description,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      color: ROLE_DISPLAY_INFO[role].color,
      badgeColor: ROLE_DISPLAY_INFO[role].badgeColor,
    }))

    // Format custom roles
    const formattedCustomRoles = customRoles.map(role => ({
      type: "custom" as const,
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color,
      memberCount: role._count.members,
      createdBy: {
        name: role.createdBy.profile?.name || role.createdBy.email,
      },
      createdAt: role.createdAt,
    }))

    return NextResponse.json({
      defaultRoles,
      customRoles: formattedCustomRoles,
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

/**
 * POST /api/company/roles
 * Create a new custom role
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, permissions, color } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 })
    }

    // Get user and their company
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = user.companyMembership.companyId

    // Check if user has permission to manage members (which includes creating roles)
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to create roles" }, { status: 403 })
    }

    // Validate all permissions are valid enum values
    const validPermissions = Object.values(Permission)
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json({ error: `Invalid permission: ${perm}` }, { status: 400 })
      }
    }

    // Cannot include OWNER-only permissions in custom roles
    const ownerOnlyPermissions = [
      Permission.DELETE_COMPANY,
      Permission.TRANSFER_OWNERSHIP,
    ]
    
    for (const perm of permissions) {
      if (ownerOnlyPermissions.includes(perm)) {
        return NextResponse.json({ 
          error: `Cannot include ${perm} in custom role - this permission is reserved for the owner` 
        }, { status: 403 })
      }
    }

    // Check if role name already exists
    const existingRole = await prisma.companyCustomRole.findFirst({
      where: {
        companyId,
        name: name.trim(),
      },
    })

    if (existingRole) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 400 })
    }

    // Create the custom role
    const newRole = await prisma.companyCustomRole.create({
      data: {
        companyId,
        name: name.trim(),
        description: description?.trim() || null,
        permissions,
        color: color || null,
        createdById: user.id,
      },
    })

    return NextResponse.json({
      message: "Custom role created successfully",
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        color: newRole.color,
      },
    })
  } catch (error) {
    console.error("Error creating custom role:", error)
    return NextResponse.json({ error: "Failed to create custom role" }, { status: 500 })
  }
}
