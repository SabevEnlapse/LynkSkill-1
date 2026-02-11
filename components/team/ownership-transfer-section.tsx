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
import { useTranslation } from "@/lib/i18n"

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
  const { t } = useTranslation()
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
        throw new Error(data.error || t("team.failedToCancelTransfer"))
      }

      toast.success(t("team.transferCancelled"))
      setPendingTransfer(null)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToCancelTransfer"))
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
            {t("team.ownershipTransfer")}
          </CardTitle>
          <CardDescription>
            {t("team.transferCompanyOwnership")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("team.dangerZone")}</AlertTitle>
            <AlertDescription>
              {t("team.transferDangerWarning")}
            </AlertDescription>
          </Alert>

          {pendingTransfer ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("team.transferPending")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Expires {formatDistanceToNow(new Date(pendingTransfer.expiresAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground">{t("team.from")}</p>
                    <p className="font-medium">{pendingTransfer.from.name}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      {t("team.owner")}
                    </Badge>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground" />

                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground">{t("team.to")}</p>
                    <p className="font-medium">{pendingTransfer.to.name}</p>
                    <Badge variant="outline" className="mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      {t("team.newOwner")}
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
                      {t("team.firstConfirmation")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    <span>{t("team.finalConfirmation")}</span>
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
                  {t("team.cancelTransfer")}
                </Button>
                <Button
                  onClick={() => {
                    setConfirmStep(pendingTransfer.confirmedOnce ? 2 : 1)
                    setConfirmModalOpen(true)
                  }}
                  className="flex-1"
                >
                  {t("team.continueTransfer")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibleMembers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("team.noEligibleMembers")}
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                  onClick={() => setInitiateModalOpen(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {t("team.transferOwnership")}
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
  const { t } = useTranslation()
  const [selectedMember, setSelectedMember] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)

  const handleInitiate = async () => {
    if (!selectedMember) {
      toast.error(t("team.pleaseSelectMember"))
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
        throw new Error(data.error || t("team.failedToInitiateTransfer"))
      }

      toast.success(t("team.transferInitiated"), {
        description: t("team.completeConfirmationSteps"),
      })
      setSelectedMember("")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToInitiateTransfer"))
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
            {t("team.transferOwnership")}
          </DialogTitle>
          <DialogDescription>
            {t("team.selectNewOwnerDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("team.twoConfirmationStepsRequired")}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>{t("team.selectNewOwner")}</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder={t("team.selectAMember")} />
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
            {t("team.cancel")}
          </Button>
          <Button onClick={handleInitiate} disabled={loading || !selectedMember}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("team.initiateTransfer")}
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
  const { t } = useTranslation()
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
        throw new Error(data.error || t("team.confirmationFailed"))
      }

      toast.success(t("team.firstConfirmationComplete"))
      setConfirmationText("")
      onStepComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.confirmationFailed"))
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
        throw new Error(data.error || t("team.transferFailed"))
      }

      toast.success(t("team.transferSuccess"))
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.transferFailed"))
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
            {step === 1 ? t("team.firstConfirmation") : t("team.finalConfirmation")}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? t("team.typeNewOwnerNameToConfirm")
              : t("team.enterCodeAndTypeTransfer")
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {t("team.aboutToTransferTo")} <strong>{transfer.to.name}</strong>.
                {t("team.typeNameOrEmailToConfirm")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t("team.typeNewOwnerNameOrEmail")}</Label>
              <Input
                placeholder={transfer.to.name}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("team.cancel")}
              </Button>
              <Button onClick={handleConfirmFirst} disabled={loading || !confirmationText}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("team.confirm")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("team.actionCannotBeUndone")}</AlertTitle>
              <AlertDescription>
                {t("team.permanentTransferWarning")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t("team.confirmationCode")}</Label>
              <Input
                placeholder={t("team.enterTheCode")}
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
              <Label>{t("team.typeTransferOwnership")}</Label>
              <Input
                placeholder="TRANSFER OWNERSHIP"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("team.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmFinal}
                disabled={loading || confirmationText !== "TRANSFER OWNERSHIP" || !confirmationCode}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("team.completeTransfer")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
