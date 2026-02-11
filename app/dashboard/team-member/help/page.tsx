"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    HelpCircle, Search, Book, MessageCircle, FileQuestion,
    ExternalLink, Mail, Phone,
    Sparkles, Rocket, Shield, Briefcase, Star,
    GraduationCap, Building2, Send
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

function useFaqCategories() {
    const { t } = useTranslation()
    return [
        {
            id: "getting-started",
            label: t('helpPage.gettingStarted'),
            icon: Rocket,
            questions: [
                { q: t('helpPage.faqSetupProfile'), a: t('helpPage.faqSetupProfileAnswer') },
                { q: t('helpPage.faqInviteTeam'), a: t('helpPage.faqInviteTeamAnswer') },
                { q: t('helpPage.faqAiMode'), a: t('helpPage.faqAiModeAnswer') },
            ]
        },
        {
            id: "internships",
            label: t('helpPage.internships'),
            icon: Briefcase,
            questions: [
                { q: t('helpPage.faqCreateInternship'), a: t('helpPage.faqCreateInternshipAnswer') },
                { q: t('helpPage.faqEditInternship'), a: t('helpPage.faqEditInternshipAnswer') },
                { q: t('helpPage.faqFeatureInternship'), a: t('helpPage.faqFeatureInternshipAnswer') },
            ]
        },
        {
            id: "candidates",
            label: t('helpPage.candidatesCategory'),
            icon: Star,
            questions: [
                { q: t('helpPage.faqReviewApplications'), a: t('helpPage.faqReviewApplicationsAnswer') },
                { q: t('helpPage.faqContactCandidates'), a: t('helpPage.faqContactCandidatesAnswer') },
                { q: t('helpPage.faqApproveReject'), a: t('helpPage.faqApproveRejectAnswer') },
            ]
        },
        {
            id: "account",
            label: t('helpPage.accountAndBilling'),
            icon: Shield,
            questions: [
                { q: t('helpPage.faqUpdateCompanyInfo'), a: t('helpPage.faqUpdateCompanyInfoAnswer') },
                { q: t('helpPage.faqManagePermissions'), a: t('helpPage.faqManagePermissionsAnswer') },
                { q: t('helpPage.faqDeleteAccount'), a: t('helpPage.faqDeleteAccountAnswer') },
            ]
        },
    ]
}

function useQuickLinks() {
    const { t } = useTranslation()
    return [
        { label: t('helpPage.studentGuide'), href: "/dashboard/company/help/student-guide", icon: GraduationCap },
        { label: t('helpPage.companyGuide'), href: "/dashboard/company/help/company-guide", icon: Building2 },
        { label: t('helpPage.privacyPolicy'), href: "/privacy", icon: Shield },
        { label: t('helpPage.termsOfService'), href: "/terms", icon: FileQuestion },
    ]
}

export default function HelpPage() {
    const { t } = useTranslation()
    const faqCategories = useFaqCategories()
    const quickLinks = useQuickLinks()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("getting-started")
    const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" })
    const [isSending, setIsSending] = useState(false)

    const filteredFAQs = faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => 
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0)

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm),
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message')
            }
            
            toast.success(t('helpPage.messageSent'), {
                description: t('helpPage.messageSentDesc'),
            })
            
            setContactForm({ name: "", email: "", message: "" })
        } catch (error) {
            toast.error(t('helpPage.failedToSend'), {
                description: error instanceof Error ? error.message : t('helpPage.tryAgainLater'),
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                            <HelpCircle className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.help')}</h1>
                            <p className="text-muted-foreground">{t('helpPage.findAnswers')}</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={t('helpPage.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-violet-500/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {quickLinks.map((link) => (
                    <Link key={link.label} href={link.href}>
                        <Card className="hover:border-violet-500/30 transition-all duration-200 hover:shadow-lg group cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-colors">
                                    <link.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="font-medium text-sm">{link.label}</span>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* FAQ Categories - Left Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="sticky top-20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Book className="h-4 w-4 text-violet-500" />
                                {t('helpPage.faqCategories')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {faqCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                            selectedCategory === category.id
                                                ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-violet-600 dark:text-violet-400"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <category.icon className="h-4 w-4" />
                                        {category.label}
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* FAQ Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    {/* FAQ Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileQuestion className="h-5 w-5 text-violet-500" />
                                {t('helpPage.faq')}
                            </CardTitle>
                            <CardDescription>
                                {t('helpPage.findQuickAnswers')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {searchQuery ? (
                                    <motion.div
                                        key="search-results"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {filteredFAQs.length > 0 ? (
                                            <div className="space-y-6">
                                                {filteredFAQs.map((category) => (
                                                    <div key={category.id}>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                                            <category.icon className="h-4 w-4" />
                                                            {category.label}
                                                        </h3>
                                                        <Accordion type="single" collapsible className="space-y-2">
                                                            {category.questions.map((item, i) => (
                                                                <AccordionItem 
                                                                    key={i} 
                                                                    value={`${category.id}-${i}`}
                                                                    className="border rounded-xl px-4"
                                                                >
                                                                    <AccordionTrigger className="hover:no-underline py-4">
                                                                        <span className="text-left font-medium">{item.q}</span>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="text-muted-foreground pb-4">
                                                                        {item.a}
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-muted-foreground">{t('helpPage.noResultsFor')} &ldquo;{searchQuery}&rdquo;</p>
                                                <p className="text-sm text-muted-foreground mt-1">{t('helpPage.tryDifferentKeywords')}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedCategory}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {faqCategories.find(c => c.id === selectedCategory) && (
                                            <Accordion type="single" collapsible className="space-y-2">
                                                {faqCategories
                                                    .find(c => c.id === selectedCategory)
                                                    ?.questions.map((item, i) => (
                                                        <AccordionItem 
                                                            key={i} 
                                                            value={`item-${i}`}
                                                            className="border rounded-xl px-4"
                                                        >
                                                            <AccordionTrigger className="hover:no-underline py-4">
                                                                <span className="text-left font-medium">{item.q}</span>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="text-muted-foreground pb-4">
                                                                {item.a}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                            </Accordion>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>

                    {/* Contact Support */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-violet-500" />
                                {t('helpPage.contactSupport')}
                            </CardTitle>
                            <CardDescription>
                                {t('helpPage.cantFindAnswer')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('helpPage.nameLabel')}</label>
                                        <Input
                                            placeholder={t('helpPage.namePlaceholder')}
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('helpPage.emailLabel')}</label>
                                        <Input
                                            type="email"
                                            placeholder={t('helpPage.emailPlaceholder')}
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('helpPage.messageLabel')}</label>
                                        <Textarea
                                            placeholder={t('helpPage.messagePlaceholder')}
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                            required
                                            className="rounded-xl min-h-[120px]"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                                        disabled={isSending}
                                    >
                                        {isSending ? (
                                            <>{t('helpPage.sending')}</>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                {t('helpPage.sendMessage')}
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-violet-500" />
                                            {t('helpPage.emailUs')}
                                        </h4>
                                        <a href="mailto:lynkskillweb@gmail.com" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">lynkskillweb@gmail.com</a>
                                        <p className="text-xs text-muted-foreground mt-1">{t('helpPage.weRespondWithin24h')}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-violet-500" />
                                            {t('helpPage.callUs')}
                                        </h4>
                                        <a href="tel:+359885031865" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">+359 885 031 865</a>
                                        <p className="text-xs text-muted-foreground mt-1">{t('helpPage.workingHours')}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-violet-500" />
                                            {t('helpPage.proTip')}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {t('helpPage.proTipDesc')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
