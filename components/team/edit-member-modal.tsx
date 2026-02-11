"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Shield, Settings } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface Member {
  id: string
  userId: string
  name: string
  email: string
  defaultRole: string | null
  customRole: {
    id: string
    name: string
    color: string | null
  } | null
  extraPermissions: string[]
  status: string
}

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
  onSuccess: () => void
}

const DEFAULT_ROLES = [
  { value: "ADMIN", labelKey: "team.roleAdmin", descKey: "team.adminDesc" },
  { value: "HR_MANAGER", labelKey: "team.roleHRManager", descKey: "team.hrManagerDesc" },
  { value: "HR_RECRUITER", labelKey: "team.roleHRRecruiter", descKey: "team.hrRecruiterDesc" },
  { value: "VIEWER", labelKey: "team.roleViewer", descKey: "team.viewerDesc" },
]

const PERMISSIONS_BY_CATEGORY: Record<string, { value: string; labelKey: string }[]> = {
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

export function EditMemberModal({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditMemberModalProps) {
  const { t } = useTranslation()
  const [role, setRole] = React.useState<string>(member.defaultRole || "VIEWER")
  const [extraPermissions, setExtraPermissions] = React.useState<string[]>(
    member.extraPermissions || []
  )
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("role")

  const handleTogglePermission = (permission: string) => {
    setExtraPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSaveRole = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/company/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultRole: role }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("team.failedToUpdateRole"))
      }

      toast.success(t("team.roleUpdated"), {
        description: `${member.name} ${t("team.roleHasBeenUpdated")}`,
      })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToUpdateRole"))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/company/members/${member.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: extraPermissions }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("team.failedToUpdatePermissions"))
      }

      toast.success(t("team.permissionsUpdated"), {
        description: `${member.name} ${t("team.permissionsHaveBeenUpdated")}`,
      })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToUpdatePermissions"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("team.editTeamMember")}</DialogTitle>
          <DialogDescription>
            {t("team.updateRoleAndPermissionsFor")} {member.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("team.role")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("team.extraPermissions")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("team.selectRole")}</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={t("team.selectARole")} />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{t(r.labelKey)}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(r.descKey)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("team.cancel")}
              </Button>
              <Button onClick={handleSaveRole} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("team.saveRole")}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("team.grantAdditionalPermissions")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("team.permissionsAddedOnTop")}
              </p>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {Object.entries(PERMISSIONS_BY_CATEGORY).map(([categoryKey, permissions]) => (
                <div key={categoryKey} className="mb-4">
                  <h4 className="font-medium text-sm mb-2">{t(categoryKey)}</h4>
                  <div className="space-y-2 ml-2">
                    {permissions.map((perm) => (
                      <div key={perm.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.value}
                          checked={extraPermissions.includes(perm.value)}
                          onCheckedChange={() => handleTogglePermission(perm.value)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={perm.value}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t(perm.labelKey)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("team.cancel")}
              </Button>
              <Button onClick={handleSavePermissions} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("team.savePermissions")}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
