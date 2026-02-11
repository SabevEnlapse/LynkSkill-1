"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreHorizontal,
  Shield,
  UserMinus,
  Settings,
  Crown,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { RoleBadge } from "./role-badge"
import { EditMemberModal } from "./edit-member-modal"
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
  invitedAt: string
  joinedAt: string | null
  invitedBy: {
    name: string
  } | null
}

interface MemberListProps {
  members: Member[]
  companyId: string
  onUpdate: () => void
  canManageMembers?: boolean
}

export function MemberList({ members, companyId: _companyId, onUpdate, canManageMembers = false }: MemberListProps) {
  const { t } = useTranslation()
  const [removeMember, setRemoveMember] = React.useState<Member | null>(null)
  const [editMember, setEditMember] = React.useState<Member | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleRemoveMember = async () => {
    if (!removeMember) return

    setLoading(true)
    try {
      const res = await fetch(`/api/company/members/${removeMember.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("team.failedToRemoveMember"))
      }

      toast.success(t("team.memberRemoved"), {
        description: `${removeMember.name} ${t("team.hasBeenRemovedFromTeam")}`,
      })
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToRemoveMember"))
    } finally {
      setLoading(false)
      setRemoveMember(null)
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("team.noMembers")}</h3>
            <p className="text-muted-foreground mt-1">
              {t("team.inviteMembersToStart")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("team.activeMembers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.defaultRole === "OWNER" && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RoleBadge
                    defaultRole={member.defaultRole}
                    customRole={member.customRole}
                  />

                  {member.extraPermissions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{member.extraPermissions.length} {t("team.extra")}
                    </Badge>
                  )}

                  {canManageMembers && member.defaultRole !== "OWNER" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("team.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditMember(member)}>
                          <Shield className="h-4 w-4 mr-2" />
                          {t("team.changeRole")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditMember(member)}>
                          <Settings className="h-4 w-4 mr-2" />
                          {t("team.editPermissions")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRemoveMember(member)}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          {t("team.removeFromTeam")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!removeMember} onOpenChange={() => setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("team.removeTeamMember")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("team.confirmRemoveMember")}{" "}
              <span className="font-medium">{removeMember?.name}</span> {t("team.fromTheTeam")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("team.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? t("team.removing") : t("team.removeMember")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Member Modal */}
      {editMember && (
        <EditMemberModal
          open={!!editMember}
          onOpenChange={() => setEditMember(null)}
          member={editMember}
          onSuccess={() => {
            setEditMember(null)
            onUpdate()
          }}
        />
      )}
    </>
  )
}
