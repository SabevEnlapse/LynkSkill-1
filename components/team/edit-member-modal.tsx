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
  { value: "ADMIN", label: "Admin", description: "Full access except ownership" },
  { value: "HR_MANAGER", label: "HR Manager", description: "Manage internships & applications" },
  { value: "HR_RECRUITER", label: "HR Recruiter", description: "View & manage applications" },
  { value: "VIEWER", label: "Viewer", description: "Read-only access" },
]

const PERMISSIONS_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
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

export function EditMemberModal({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditMemberModalProps) {
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
        throw new Error(data.error || "Failed to update role")
      }

      toast.success("Role updated", {
        description: `${member.name}'s role has been updated`,
      })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
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
        throw new Error(data.error || "Failed to update permissions")
      }

      toast.success("Permissions updated", {
        description: `${member.name}'s permissions have been updated`,
      })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update role and permissions for {member.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Extra Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{r.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Role
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Grant Additional Permissions</Label>
              <p className="text-sm text-muted-foreground">
                These are added on top of the role&apos;s default permissions.
              </p>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {Object.entries(PERMISSIONS_BY_CATEGORY).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-sm mb-2">{category}</h4>
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
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Permissions
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
