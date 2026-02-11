"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Scale, FileText, Shield, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function TermsPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <Scale className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-balance">{t("terms.title")}</h1>
                    <p className="text-muted-foreground text-lg">{t("terms.lastUpdated")}</p>
                </div>

                {/* AGREEMENT TO TERMS */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {t("terms.agreementToTerms")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 leading-relaxed text-muted-foreground">
                        <p>
                            {t("terms.agreementToTermsText")}
                        </p>
                    </CardContent>
                </Card>

                {/* USER RESPONSIBILITIES */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            {t("terms.userResponsibilities")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 leading-relaxed">

                        {/* Account Registration */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t("terms.accountRegistration")}</h3>
                            <p className="text-muted-foreground">
                                {t("terms.accountRegistrationText")}
                            </p>
                        </div>

                        <Separator />

                        {/* Acceptable Use */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t("terms.acceptableUse")}</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>{t("terms.acceptableUse1")}</li>
                                <li>{t("terms.acceptableUse2")}</li>
                                <li>{t("terms.acceptableUse3")}</li>
                                <li>{t("terms.acceptableUse4")}</li>
                                <li>{t("terms.acceptableUse5")}</li>
                            </ul>
                        </div>

                        <Separator />

                        {/* Company Verification */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t("terms.companyVerification")}</h3>
                            <p className="text-muted-foreground">
                                {t("terms.companyVerificationText")}
                            </p>
                        </div>

                        <Separator />

                        {/* Student Information */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t("terms.studentInformation")}</h3>
                            <p className="text-muted-foreground">
                                {t("terms.studentInformationText")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* INTELLECTUAL PROPERTY */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("terms.intellectualProperty")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.intellectualPropertyText")}
                        </p>
                    </CardContent>
                </Card>

                {/* LIMITATION OF LIABILITY */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("terms.limitationOfLiability")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.limitationOfLiabilityText")}
                        </p>
                    </CardContent>
                </Card>

                {/* TERMINATION */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("terms.termination")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.terminationText")}
                        </p>
                    </CardContent>
                </Card>

                {/* GOVERNING LAW */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("terms.governingLaw")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.governingLawText")}
                        </p>
                    </CardContent>
                </Card>

                {/* CHANGES TO TERMS */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("terms.changesToTerms")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.changesToTermsText")}
                        </p>
                    </CardContent>
                </Card>

                {/* CONTACT */}
                <Card className="shadow-lg bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {t("terms.contactUs")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("terms.contactUsText")}{" "}
                            <a href="mailto:lynkskillweb@gmail.com" className="text-primary underline underline-offset-4">
                                lynkskillweb@gmail.com
                            </a>
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
