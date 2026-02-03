import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission } from "@prisma/client"

export const runtime = "nodejs"

interface RouteParams {
  params: Promise<{ roleId: string }>
}

/**
 * GET /api/company/roles/[roleId]
 * Get details of a specific custom role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { roleId } = await params
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

    const role = await prisma.companyCustomRole.findFirst({
      where: {
        id: roleId,
        companyId: user.companyMembership.companyId,
      },
      include: {
        createdBy: {
          include: {
            profile: true,
          },
        },
        members: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color,
      createdBy: {
        name: role.createdBy.profile?.name || role.createdBy.email,
      },
      createdAt: role.createdAt,
      members: role.members.map(m => ({
        id: m.id,
        name: m.user.profile?.name || m.user.email,
        email: m.user.email,
      })),
    })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}

/**
 * PATCH /api/company/roles/[roleId]
 * Update a custom role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { roleId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, permissions, color } = body

    // Get the requesting user's membership
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

    // Check if user has permission
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to edit roles" }, { status: 403 })
    }

    // Get the role
    const existingRole = await prisma.companyCustomRole.findFirst({
      where: {
        id: roleId,
        companyId,
      },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Build update data
    const updateData: {
      name?: string
      description?: string | null
      permissions?: Permission[]
      color?: string | null
    } = {}

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Role name cannot be empty" }, { status: 400 })
      }
      
      // Check if name is already taken by another role
      const duplicateName = await prisma.companyCustomRole.findFirst({
        where: {
          companyId,
          name: name.trim(),
          id: { not: roleId },
        },
      })
      
      if (duplicateName) {
        return NextResponse.json({ error: "A role with this name already exists" }, { status: 400 })
      }
      
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 })
      }

      // Validate permissions
      const validPermissions = Object.values(Permission)
      for (const perm of permissions) {
        if (!validPermissions.includes(perm)) {
          return NextResponse.json({ error: `Invalid permission: ${perm}` }, { status: 400 })
        }
      }

      // Cannot include OWNER-only permissions
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

      updateData.permissions = permissions
    }

    if (color !== undefined) {
      updateData.color = color || null
    }

    // Update the role
    const updatedRole = await prisma.companyCustomRole.update({
      where: { id: roleId },
      data: updateData,
    })

    return NextResponse.json({
      message: "Role updated successfully",
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        color: updatedRole.color,
      },
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

/**
 * DELETE /api/company/roles/[roleId]
 * Delete a custom role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { roleId } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the requesting user's membership
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

    // Check if user has permission
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to delete roles" }, { status: 403 })
    }

    // Get the role with member count
    const role = await prisma.companyCustomRole.findFirst({
      where: {
        id: roleId,
        companyId,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Check if any members are assigned to this role
    if (role._count.members > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role - ${role._count.members} member(s) are assigned to this role. Reassign them first.` 
      }, { status: 400 })
    }

    // Delete the role
    await prisma.companyCustomRole.delete({
      where: { id: roleId },
    })

    return NextResponse.json({
      message: "Role deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
