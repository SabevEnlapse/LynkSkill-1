"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Clock,
  Mail,
  X,
  UserPlus,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { RoleBadge } from "./role-badge"
import { formatDistanceToNow } from "date-fns"

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
  status: string
  invitedAt: string
  invitedBy: {
    name: string
  } | null
}

interface PendingInvitationsProps {
  members: Member[]
  companyId: string
  onUpdate: () => void
}

export function PendingInvitations({
  members,
  companyId: _companyId,
  onUpdate,
}: PendingInvitationsProps) {
  const [cancelMember, setCancelMember] = React.useState<Member | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleCancelInvitation = async () => {
    if (!cancelMember) return

    setLoading(true)
    try {
      const res = await fetch(`/api/company/members/${cancelMember.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to cancel invitation")
      }

      toast.success("Invitation cancelled")
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel invitation")
    } finally {
      setLoading(false)
      setCancelMember(null)
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pending invitations</h3>
            <p className="text-muted-foreground mt-1">
              All invitations have been accepted or expired
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg border-dashed"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.email}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invited {formatDistanceToNow(new Date(member.invitedAt), { addSuffix: true })}
                      {member.invitedBy && ` by ${member.invitedBy.name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RoleBadge
                    defaultRole={member.defaultRole}
                    customRole={member.customRole}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement resend invitation
                      toast.info("Resend functionality coming soon")
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCancelMember(member)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Invitation Dialog */}
      <AlertDialog open={!!cancelMember} onOpenChange={() => setCancelMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{" "}
              <span className="font-medium">{cancelMember?.email}</span>?
              They will no longer be able to join using the invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
