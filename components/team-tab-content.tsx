"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { InviteMemberModal } from "@/components/team/invite-member-modal"
import { MemberList } from "@/components/team/member-list"
import { RolesList } from "@/components/team/roles-list"
import { PendingInvitations } from "@/components/team/pending-invitations"
import { OwnershipTransferSection } from "@/components/team/ownership-transfer-section"
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

interface MembersData {
  members: Member[]
  companyId: string
}

function TeamTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function TeamTabContent() {
  const { t } = useTranslation()
  const [members, setMembers] = React.useState<Member[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false)
  const [_currentUserRole, setCurrentUserRole] = React.useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = React.useState("members")

  const fetchMembers = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/company/members")
      if (!res.ok) {
        throw new Error("Failed to fetch team members")
      }
      const data: MembersData = await res.json()
      setMembers(data.members)
      setCompanyId(data.companyId)

      // Find current user's role (the OWNER)
      const owner = data.members.find(m => m.defaultRole === "OWNER")
      if (owner) {
        setCurrentUserRole(owner.defaultRole)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleInviteSuccess = () => {
    setInviteModalOpen(false)
    fetchMembers()
  }

  const handleMemberUpdate = () => {
    fetchMembers()
  }

  if (loading) {
    return <TeamTabSkeleton />
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchMembers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('team.retry') || 'Retry'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeMembers = members.filter(m => m.status === "ACTIVE")
  const pendingMembers = members.filter(m => m.status === "PENDING")
  const owner = members.find(m => m.defaultRole === "OWNER")
  const admins = members.filter(m => m.defaultRole === "ADMIN" && m.status === "ACTIVE")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-500" />
            {t('team.title') || 'Team Management'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {t('team.subtitle') || 'Manage your team members, roles, and permissions'}
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('team.inviteMember') || 'Invite Member'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('team.totalMembers') || 'Total Members'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              {t('team.owner') || 'Owner'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {owner?.name || '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              {t('team.admins') || 'Admins'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-500" />
              {t('team.pending') || 'Pending'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs for Members, Roles, Invitations, Ownership */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('team.members') || 'Members'}</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('team.roles') || 'Roles'}</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('team.invitations') || 'Invitations'}</span>
          </TabsTrigger>
          <TabsTrigger value="ownership" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">{t('team.ownership') || 'Ownership'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          {companyId && (
            <MemberList
              members={activeMembers}
              companyId={companyId}
              onUpdate={handleMemberUpdate}
            />
          )}
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          {companyId && <RolesList companyId={companyId} />}
        </TabsContent>

        <TabsContent value="invitations" className="mt-6">
          {companyId && (
            <PendingInvitations
              members={pendingMembers}
              companyId={companyId}
              onUpdate={handleMemberUpdate}
            />
          )}
        </TabsContent>

        <TabsContent value="ownership" className="mt-6">
          {companyId && (
            <OwnershipTransferSection
              companyId={companyId}
              members={activeMembers.filter(m => m.defaultRole !== "OWNER")}
              onUpdate={handleMemberUpdate}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}
