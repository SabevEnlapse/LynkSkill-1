"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Database, Eye, Lock, Cookie, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function PrivacyPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <ShieldCheck className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-balance">{t("privacy.title")}</h1>
                    <p className="text-muted-foreground text-lg">{t("privacy.lastUpdated")}</p>
                </div>

                {/* Introduction */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("privacy.introTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("privacy.introText1")}
                        </p>

                        <p className="text-muted-foreground">
                            {t("privacy.introText2")}
                        </p>
                    </CardContent>
                </Card>

                {/* Information We Collect */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            {t("privacy.informationWeCollect")}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 leading-relaxed">

                        {/* Personal Information */}
                        <div>
                            <h3 className="font-semibold text-lg mb-3">{t("privacy.personalInformation")}</h3>
                            <p className="text-muted-foreground mb-3">
                                {t("privacy.personalInformationText")}
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>{t("privacy.personalInfo1")}</li>
                                <li>{t("privacy.personalInfo2")}</li>
                                <li>{t("privacy.personalInfo3")}</li>
                                <li>{t("privacy.personalInfo4")}</li>
                                <li>{t("privacy.personalInfo5")}</li>
                            </ul>
                        </div>

                        <Separator />

                        {/* Automatic data */}
                        <div>
                            <h3 className="font-semibold text-lg mb-3">{t("privacy.automaticInformation")}</h3>
                            <p className="text-muted-foreground mb-3">
                                {t("privacy.automaticInformationText")}
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>{t("privacy.autoInfo1")}</li>
                                <li>{t("privacy.autoInfo2")}</li>
                                <li>{t("privacy.autoInfo3")}</li>
                                <li>{t("privacy.autoInfo4")}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* How We Use Data */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            {t("privacy.howWeUseInfo")}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("privacy.howWeUseInfoText")}
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>{t("privacy.useInfo1")}</li>
                            <li>{t("privacy.useInfo2")}</li>
                            <li>{t("privacy.useInfo3")}</li>
                            <li>{t("privacy.useInfo4")}</li>
                            <li>{t("privacy.useInfo5")}</li>
                            <li>{t("privacy.useInfo6")}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Data Security */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            {t("privacy.dataSecurity")}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("privacy.dataSecurityText")}
                        </p>

                        <div className="bg-muted/50 p-4 rounded-lg border border-border">
                            <p className="text-sm">
                                <strong>{t("privacy.includes")}:</strong> {t("privacy.dataSecurityIncludes")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cookies */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cookie className="w-5 h-5" />
                            {t("privacy.cookiesAndTracking")}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            {t("privacy.cookiesText")}
                        </p>

                        <h3 className="font-semibold mb-2">{t("privacy.typesOfCookies")}:</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li><strong>{t("privacy.essential")}:</strong> {t("privacy.essentialDesc")}</li>
                            <li><strong>{t("privacy.analytics")}:</strong> {t("privacy.analyticsDesc")}</li>
                            <li><strong>{t("privacy.preference")}:</strong> {t("privacy.preferenceDesc")}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* GDPR */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{t("privacy.gdprRights")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">{t("privacy.gdprRightsText")}</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>{t("privacy.rightAccess")}</li>
                            <li>{t("privacy.rightRectification")}</li>
                            <li>{t("privacy.rightErasure")}</li>
                            <li>{t("privacy.rightRestrict")}</li>
                            <li>{t("privacy.rightPortability")}</li>
                            <li>{t("privacy.rightObject")}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="shadow-lg bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {t("privacy.contactUs")}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("privacy.contactUsText")}{" "}
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
