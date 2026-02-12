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
import { useTranslation } from "@/lib/i18n"

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

const PERMISSIONS_BY_CATEGORY: Record<string, { value: string; labelKey: string }[]> = {
  "team.permCategoryCompany": [
    { value: "EDIT_COMPANY", labelKey: "team.permEditCompany" },
  ],
  "team.permCategoryMember": [
    { value: "MANAGE_MEMBERS", labelKey: "team.permManageMembers" },
    { value: "INVITE_MEMBERS", labelKey: "team.permInviteMembers" },
    { value: "REMOVE_MEMBERS", labelKey: "team.permRemoveMembers" },
    { value: "CHANGE_ROLES", labelKey: "team.permChangeRoles" },
    { value: "DELEGATE_PERMISSIONS", labelKey: "team.permDelegatePermissions" },
  ],
  "team.permCategoryInternship": [
    { value: "CREATE_INTERNSHIPS", labelKey: "team.permCreateInternships" },
    { value: "EDIT_INTERNSHIPS", labelKey: "team.permEditInternships" },
    { value: "DELETE_INTERNSHIPS", labelKey: "team.permDeleteInternships" },
  ],
  "team.permCategoryApplication": [
    { value: "VIEW_APPLICATIONS", labelKey: "team.permViewApplications" },
    { value: "MANAGE_APPLICATIONS", labelKey: "team.permManageApplications" },
  ],
  "team.permCategoryCandidate": [
    { value: "VIEW_CANDIDATES", labelKey: "team.permViewCandidates" },
    { value: "SEARCH_CANDIDATES", labelKey: "team.permSearchCandidates" },
  ],
  "team.permCategoryInterview": [
    { value: "SCHEDULE_INTERVIEWS", labelKey: "team.permScheduleInterviews" },
    { value: "CONDUCT_INTERVIEWS", labelKey: "team.permConductInterviews" },
  ],
  "team.permCategoryMessaging": [
    { value: "SEND_MESSAGES", labelKey: "team.permSendMessages" },
    { value: "VIEW_MESSAGES", labelKey: "team.permViewMessages" },
  ],
  "team.permCategoryExperience": [
    { value: "CREATE_ASSIGNMENTS", labelKey: "team.permCreateAssignments" },
    { value: "GRADE_EXPERIENCES", labelKey: "team.permGradeExperiences" },
  ],
}

export function RolesList({ companyId: _companyId }: RolesListProps) {
  const { t } = useTranslation()
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
      toast.error(t("team.failedToLoadRoles"))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <CardTitle className="text-lg">{t("team.defaultRoles")}</CardTitle>
          <CardDescription>
            {t("team.builtInRolesDescription")}
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
                    {role.permissions.length} {t("team.permissions")}
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
            <CardTitle className="text-lg">{t("team.customRoles")}</CardTitle>
            <CardDescription>
              {t("team.customRolesDescription")}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("team.createRole")}
          </Button>
        </CardHeader>
        <CardContent>
          {roles?.customRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t("team.noCustomRolesYet")}</h3>
              <p className="text-muted-foreground mt-1">
                {t("team.createCustomRolesForNeeds")}
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
  const { t } = useTranslation()
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/company/roles/${role.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("team.failedToDeleteRole"))
      }

      toast.success(t("team.roleDeleted"))
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToDeleteRole"))
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
          {role.permissions.length} {t("team.permissions")}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {role.memberCount} {t("team.members")}
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
  const { t } = useTranslation()
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
      toast.error(t("team.roleNameRequired"))
      return
    }

    if (permissions.length === 0) {
      toast.error(t("team.selectAtLeastOnePermission"))
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
        throw new Error(data.error || t("team.failedToCreateRole"))
      }

      toast.success(t("team.roleCreated"))
      setName("")
      setDescription("")
      setPermissions([])
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToCreateRole"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("team.createCustomRole")}</DialogTitle>
          <DialogDescription>
            {t("team.defineNewRoleWithPermissions")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="name">{t("team.roleName")}</Label>
              <Input
                id="name"
                placeholder={t("team.roleNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t("team.roleColor")}</Label>
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
            <Label htmlFor="description">{t("team.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("team.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("team.permissions")}</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {Object.entries(PERMISSIONS_BY_CATEGORY).map(([categoryKey, perms]) => (
                <div key={categoryKey} className="mb-4">
                  <h4 className="font-medium text-sm mb-2">{t(categoryKey)}</h4>
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
                          {t(perm.labelKey)}
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
              {t("team.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("team.createRole")}
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
