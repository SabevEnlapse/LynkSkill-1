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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, FileText, CheckCircle } from "lucide-react"

interface StudentPolicyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    portfolioId: string | null
    onAccept: () => Promise<void>
    tosChecked: boolean
    privacyChecked: boolean
    onTosChange: (checked: boolean) => void
    onPrivacyChange: (checked: boolean) => void
}

export function StudentPolicyModal({
                                       open,
                                       onOpenChange,
                                       portfolioId,
                                       onAccept,
                                       tosChecked,
                                       privacyChecked,
                                       onTosChange,
                                       onPrivacyChange,
                                   }: StudentPolicyModalProps) {
    const [isAccepting, setIsAccepting] = React.useState(false)

    const handleAccept = async () => {
        if (!tosChecked || !privacyChecked) return
        setIsAccepting(true)
        try {
            await onAccept()
        } finally {
            setIsAccepting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[var(--experience-accent)] to-[var(--experience-button-primary-hover)] rounded-xl shadow-lg">
                            <Shield className="w-6 h-6 text-[var(--experience-accent-foreground)]" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">Privacy Policy & Terms of Service</DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                Please review and accept our policies to continue
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {/* Terms of Service Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[var(--experience-accent)]" />
                                <h3 className="text-lg font-bold">Terms of Service</h3>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm leading-relaxed">
                                <p>
                                    <strong>1. Acceptance of Terms</strong>
                                    <br />
                                    By accessing and using LynkSkill as a student, you accept and agree to be bound by the terms and
                                    provision of this agreement.
                                </p>
                                <p>
                                    <strong>2. User Responsibilities</strong>
                                    <br />
                                    You agree to provide accurate information in your profile and portfolio. You are responsible for
                                    maintaining the confidentiality of your account credentials.
                                </p>
                                <p>
                                    <strong>3. Content Guidelines</strong>
                                    <br />
                                    All content you upload must be your own work or properly attributed. You grant LynkSkill a license to
                                    display your portfolio content to potential employers and educational institutions.
                                </p>
                                <p>
                                    <strong>4. Age Requirements</strong>
                                    <br />
                                    In accordance with Bulgarian law, students must be at least 16 years old to use this platform
                                    independently. This age requirement complies with Bulgarian regulations regarding digital services and
                                    data processing for minors. Users under 18 may require parental consent for certain features.
                                </p>
                                <p>
                                    <strong>5. Prohibited Activities</strong>
                                    <br />
                                    You may not use the platform for any illegal purposes, harassment, spam, or to impersonate others.
                                </p>
                            </div>
                        </div>

                        {/* Privacy Policy Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[var(--experience-accent)]" />
                                <h3 className="text-lg font-bold">Privacy Policy</h3>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm leading-relaxed">
                                <p>
                                    <strong>1. Information We Collect</strong>
                                    <br />
                                    We collect information you provide directly, including your name, email, date of birth, educational
                                    background, skills, and portfolio content.
                                </p>
                                <p>
                                    <strong>2. How We Use Your Information</strong>
                                    <br />
                                    Your information is used to create and maintain your student profile, match you with opportunities,
                                    and improve our services. We may share your portfolio with verified companies and educational
                                    institutions.
                                </p>
                                <p>
                                    <strong>3. Data Protection</strong>
                                    <br />
                                    We implement industry-standard security measures to protect your personal information. Your data is
                                    encrypted and stored securely.
                                </p>
                                <p>
                                    <strong>4. Your Rights</strong>
                                    <br />
                                    You have the right to access, modify, or delete your personal information at any time. You can control
                                    who sees your portfolio and what information is shared.
                                </p>
                                <p>
                                    <strong>5. Cookies and Tracking</strong>
                                    <br />
                                    We use cookies to improve your experience and analyze platform usage. You can control cookie
                                    preferences in your browser settings.
                                </p>
                                <p>
                                    <strong>6. Third-Party Services</strong>
                                    <br />
                                    We may use third-party services for authentication, analytics, and communication. These services have
                                    their own privacy policies.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex-col sm:flex-col gap-4 pt-4 border-t">
                    <div className="space-y-3 w-full">
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="tos"
                                checked={tosChecked}
                                onCheckedChange={(checked) => onTosChange(checked === true)}
                                className="mt-1"
                            />
                            <Label htmlFor="tos" className="text-sm leading-relaxed cursor-pointer flex-1">
                                I have read and agree to the <strong>Terms of Service</strong>
                            </Label>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="privacy"
                                checked={privacyChecked}
                                onCheckedChange={(checked) => onPrivacyChange(checked === true)}
                                className="mt-1"
                            />
                            <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer flex-1">
                                I have read and agree to the <strong>Privacy Policy</strong>
                            </Label>
                        </div>
                    </div>

                    <Button
                        onClick={handleAccept}
                        disabled={!tosChecked || !privacyChecked || isAccepting}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[var(--experience-accent)] to-[var(--experience-button-primary-hover)] hover:from-[var(--experience-button-primary-hover)] hover:to-[var(--experience-accent)] shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        {isAccepting ? (
                            <>
                                <div className="w-5 h-5 border-3 border-[var(--experience-accent-foreground)]/30 border-t-[var(--experience-accent-foreground)] rounded-full animate-spin mr-2" />
                                Accepting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 w-5 h-5" />
                                Accept and Continue
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
