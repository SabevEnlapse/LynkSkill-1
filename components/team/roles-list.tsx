"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Shield,
  Edit,
  Trash2,
  Loader2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

interface CustomRole {
  type: "custom"
  id: string
  name: string
  description: string | null
  permissions: string[]
  color: string | null
  memberCount: number
  createdBy: {
    name: string
  }
  createdAt: string
}

interface DefaultRole {
  type: "default"
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  badgeColor: string
}

interface RolesData {
  defaultRoles: DefaultRole[]
  customRoles: CustomRole[]
}

interface RolesListProps {
  companyId: string
}

const PERMISSIONS_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  "Company Management": [
    { value: "EDIT_COMPANY", label: "Edit Company" },
  ],
  "Member Management": [
    { value: "MANAGE_MEMBERS", label: "Manage Members" },
    { value: "INVITE_MEMBERS", label: "Invite Members" },
    { value: "REMOVE_MEMBERS", label: "Remove Members" },
    { value: "CHANGE_ROLES", label: "Change Roles" },
    { value: "DELEGATE_PERMISSIONS", label: "Delegate Permissions" },
  ],
  "Internship Management": [
    { value: "CREATE_INTERNSHIPS", label: "Create Internships" },
    { value: "EDIT_INTERNSHIPS", label: "Edit Internships" },
    { value: "DELETE_INTERNSHIPS", label: "Delete Internships" },
  ],
  "Application Management": [
    { value: "VIEW_APPLICATIONS", label: "View Applications" },
    { value: "MANAGE_APPLICATIONS", label: "Manage Applications" },
  ],
  "Candidate Management": [
    { value: "VIEW_CANDIDATES", label: "View Candidates" },
    { value: "SEARCH_CANDIDATES", label: "Search Candidates" },
  ],
  "Interview Management": [
    { value: "SCHEDULE_INTERVIEWS", label: "Schedule Interviews" },
    { value: "CONDUCT_INTERVIEWS", label: "Conduct Interviews" },
  ],
  "Messaging": [
    { value: "SEND_MESSAGES", label: "Send Messages" },
    { value: "VIEW_MESSAGES", label: "View Messages" },
  ],
  "Experience & Assignments": [
    { value: "CREATE_ASSIGNMENTS", label: "Create Assignments" },
    { value: "GRADE_EXPERIENCES", label: "Grade Experiences" },
  ],
}

export function RolesList({ companyId: _companyId }: RolesListProps) {
  const [roles, setRoles] = React.useState<RolesData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)

  const fetchRoles = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/company/roles")
      if (!res.ok) throw new Error("Failed to fetch roles")
      const data = await res.json()
      setRoles(data)
    } catch (_err) {
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  if (loading) {
    return <RolesListSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Default Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default Roles</CardTitle>
          <CardDescription>
            Built-in roles with predefined permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles?.defaultRoles.map((role) => (
              <div
                key={role.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: role.color }} />
                  <span className="font-medium">{role.name}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {role.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {role.permissions.length} permissions
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Roles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Custom Roles</CardTitle>
            <CardDescription>
              Create custom roles with specific permissions
            </CardDescription>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </CardHeader>
        <CardContent>
          {roles?.customRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No custom roles yet</h3>
              <p className="text-muted-foreground mt-1">
                Create custom roles for specific team needs
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {roles?.customRoles.map((role) => (
                <CustomRoleCard
                  key={role.id}
                  role={role}
                  onUpdate={fetchRoles}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false)
          fetchRoles()
        }}
      />
    </div>
  )
}

function CustomRoleCard({
  role,
  onUpdate,
}: {
  role: CustomRole
  onUpdate: () => void
}) {
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/company/roles/${role.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete role")
      }

      toast.success("Role deleted")
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="p-4 border rounded-lg space-y-2"
      style={{
        borderColor: role.color || undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield
            className="h-4 w-4"
            style={{ color: role.color || undefined }}
          />
          <span className="font-medium">{role.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting || role.memberCount > 0}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {role.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {role.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs">
        <Badge variant="secondary">
          {role.permissions.length} permissions
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {role.memberCount} members
        </Badge>
      </div>
    </div>
  )
}

function CreateRoleModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [color, setColor] = React.useState("#6366f1")
  const [loading, setLoading] = React.useState(false)

  const handleTogglePermission = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Role name is required")
      return
    }

    if (permissions.length === 0) {
      toast.error("Select at least one permission")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/company/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions,
          color,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create role")
      }

      toast.success("Role created")
      setName("")
      setDescription("")
      setPermissions([])
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="e.g., Intern Coordinator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 p-1 cursor-pointer"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {Object.entries(PERMISSIONS_BY_CATEGORY).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-sm mb-2">{category}</h4>
                  <div className="space-y-2 ml-2">
                    {perms.map((perm) => (
                      <div key={perm.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${perm.value}`}
                          checked={permissions.includes(perm.value)}
                          onCheckedChange={() => handleTogglePermission(perm.value)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={`create-${perm.value}`}
                          className="text-sm leading-none"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RolesListSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
