"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Crown,
  Shield,
  Loader2,
  Clock,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Member {
  id: string
  userId: string
  name: string
  email: string
  defaultRole: string | null
}

interface TransferRequest {
  id: string
  from: {
    id: string
    name: string
  }
  to: {
    id: string
    name: string
  }
  confirmedOnce: boolean
  confirmationCode?: string
  expiresAt: string
  createdAt: string
}

interface OwnershipTransferSectionProps {
  members: Member[]
  companyId: string
  onUpdate: () => void
}

export function OwnershipTransferSection({
  members,
  companyId: _companyId,
  onUpdate,
}: OwnershipTransferSectionProps) {
  const [pendingTransfer, setPendingTransfer] = React.useState<TransferRequest | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [initiateModalOpen, setInitiateModalOpen] = React.useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false)
  const [confirmStep, setConfirmStep] = React.useState<1 | 2>(1)

  const eligibleMembers = members.filter(m => m.defaultRole !== "OWNER")

  const fetchPendingTransfer = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/company/ownership/transfer")
      if (!res.ok) throw new Error("Failed to fetch transfer status")
      const data = await res.json()
      setPendingTransfer(data.pendingTransfer)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPendingTransfer()
  }, [fetchPendingTransfer])

  const handleCancelTransfer = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/company/ownership/transfer/cancel", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to cancel transfer")
      }

      toast.success("Transfer cancelled")
      setPendingTransfer(null)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel transfer")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Ownership Transfer
          </CardTitle>
          <CardDescription>
            Transfer company ownership to another team member
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription>
              Transferring ownership will give full control of the company to another member.
              This action requires multiple confirmations and cannot be easily undone.
            </AlertDescription>
          </Alert>

          {pendingTransfer ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <Clock className="h-3 w-3 mr-1" />
                    Transfer Pending
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Expires {formatDistanceToNow(new Date(pendingTransfer.expiresAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{pendingTransfer.from.name}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground" />

                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{pendingTransfer.to.name}</p>
                    <Badge variant="outline" className="mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      New Owner
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    {pendingTransfer.confirmedOnce ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={pendingTransfer.confirmedOnce ? "text-green-600" : ""}>
                      First confirmation
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    <span>Final confirmation</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelTransfer}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Transfer
                </Button>
                <Button
                  onClick={() => {
                    setConfirmStep(pendingTransfer.confirmedOnce ? 2 : 1)
                    setConfirmModalOpen(true)
                  }}
                  className="flex-1"
                >
                  Continue Transfer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibleMembers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No eligible members to transfer ownership to.
                  Invite team members first.
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                  onClick={() => setInitiateModalOpen(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiate Transfer Modal */}
      <InitiateTransferModal
        open={initiateModalOpen}
        onOpenChange={setInitiateModalOpen}
        members={eligibleMembers}
        onSuccess={() => {
          setInitiateModalOpen(false)
          fetchPendingTransfer()
        }}
      />

      {/* Confirm Transfer Modal */}
      {pendingTransfer && (
        <ConfirmTransferModal
          open={confirmModalOpen}
          onOpenChange={setConfirmModalOpen}
          transfer={pendingTransfer}
          step={confirmStep}
          onSuccess={() => {
            setConfirmModalOpen(false)
            fetchPendingTransfer()
            onUpdate()
          }}
          onStepComplete={() => {
            setConfirmStep(2)
            fetchPendingTransfer()
          }}
        />
      )}
    </>
  )
}

function InitiateTransferModal({
  open,
  onOpenChange,
  members,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  onSuccess: () => void
}) {
  const [selectedMember, setSelectedMember] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)

  const handleInitiate = async () => {
    if (!selectedMember) {
      toast.error("Please select a member")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/company/ownership/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          toMemberId: selectedMember,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to initiate transfer")
      }

      toast.success("Transfer initiated", {
        description: "Complete the confirmation steps to finalize the transfer",
      })
      setSelectedMember("")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate transfer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Select the member who will become the new owner of this company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              After initiating, you&apos;ll need to complete two confirmation steps.
              The transfer will expire after 24 hours if not completed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Select New Owner</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInitiate} disabled={loading || !selectedMember}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Initiate Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmTransferModal({
  open,
  onOpenChange,
  transfer,
  step,
  onSuccess,
  onStepComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: TransferRequest
  step: 1 | 2
  onSuccess: () => void
  onStepComplete: () => void
}) {
  const [confirmationText, setConfirmationText] = React.useState("")
  const [confirmationCode, setConfirmationCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleConfirmFirst = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/company/ownership/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_first",
          confirmationText,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Confirmation failed")
      }

      toast.success("First confirmation complete")
      setConfirmationText("")
      onStepComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmFinal = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/company/ownership/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_final",
          confirmationCode,
          confirmationText,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Transfer failed")
      }

      toast.success("Ownership transferred successfully!")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {step === 1 ? "First Confirmation" : "Final Confirmation"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Type the new owner's name or email to confirm"
              : "Enter the confirmation code and type 'TRANSFER OWNERSHIP' to complete"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                You are about to transfer ownership to <strong>{transfer.to.name}</strong>.
                Type their name or email exactly to confirm.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Type the new owner&apos;s name or email</Label>
              <Input
                placeholder={transfer.to.name}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmFirst} disabled={loading || !confirmationText}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>This action cannot be undone</AlertTitle>
              <AlertDescription>
                You are about to permanently transfer ownership.
                You will become an Admin after this transfer.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Confirmation Code</Label>
              <Input
                placeholder="Enter the code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                disabled={loading}
                className="font-mono"
              />
              {transfer.confirmationCode && (
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-mono font-medium">{transfer.confirmationCode}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type &quot;TRANSFER OWNERSHIP&quot; to confirm</Label>
              <Input
                placeholder="TRANSFER OWNERSHIP"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmFinal}
                disabled={loading || confirmationText !== "TRANSFER OWNERSHIP" || !confirmationCode}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Transfer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
