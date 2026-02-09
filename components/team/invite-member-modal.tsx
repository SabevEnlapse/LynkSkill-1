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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus, Mail, Shield, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DEFAULT_ROLES = [
  { value: "ADMIN", label: "Admin", description: "Full access except ownership", color: "text-red-500 bg-red-500/10" },
  { value: "HR_MANAGER", label: "HR Manager", description: "Manage internships & applications", color: "text-blue-500 bg-blue-500/10" },
  { value: "HR_RECRUITER", label: "HR Recruiter", description: "View & manage applications", color: "text-emerald-500 bg-emerald-500/10" },
  { value: "VIEWER", label: "Viewer", description: "Read-only access", color: "text-gray-500 bg-gray-500/10" },
]

export function InviteMemberModal({
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<string>("VIEWER")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/company/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      toast.success("Invitation sent!", {
        description: `An invitation has been sent to ${email}`,
      })

      // Reset form
      setEmail("")
      setRole("VIEWER")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = DEFAULT_ROLES.find(r => r.value === role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-indigo-200/50 dark:border-indigo-800/30">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-white text-lg font-bold">
                  Invite Team Member
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm mt-0.5">
                  They&apos;ll receive an email and in-app notification to join.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-indigo-500" />
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11 border-border/60 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 rounded-xl transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              Role
            </Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="h-11 border-border/60 focus:ring-indigo-500/30 focus:border-indigo-500 rounded-xl">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DEFAULT_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="rounded-lg py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="secondary" className={`${r.color} text-[10px] px-1.5 py-0 font-semibold border-0`}>
                        {r.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Selected role preview */}
            {selectedRole && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">{selectedRole.label}</span> — {selectedRole.description}. You can change this anytime after they join.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl border-border/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 font-semibold gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
