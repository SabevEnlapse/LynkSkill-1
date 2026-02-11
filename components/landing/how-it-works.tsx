"use client"

import { motion } from "framer-motion"
import { Users, Target, MessageSquare, Trophy } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

const stepsMeta = [
    {
        number: "01",
        key: "step1",
        icon: <Users className="w-8 h-8 md:w-10 md:h-10" />,
    },
    {
        number: "02",
        key: "step2",
        icon: <Target className="w-8 h-8 md:w-10 md:h-10" />,
    },
    {
        number: "03",
        key: "step3",
        icon: <MessageSquare className="w-8 h-8 md:w-10 md:h-10" />,
    },
    {
        number: "04",
        key: "step4",
        icon: <Trophy className="w-8 h-8 md:w-10 md:h-10" />,
    },
]

export function HowItWorks() {
    const { t } = useTranslation()

    const steps = stepsMeta.map((s) => ({
        ...s,
        title: t(`landing.howItWorks.${s.key}.title`),
        description: t(`landing.howItWorks.${s.key}.description`),
    }))
    return (
        <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                        {t("landing.howItWorks.title")}{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{t("landing.howItWorks.titleHighlight")}</span>
                    </h2>
                    <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        {t("landing.howItWorks.subtitle")}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="relative h-full"
                        >
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-16 md:top-20 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50 -translate-x-4" />
                            )}

                            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 space-y-4 md:space-y-6 group hover:shadow-2xl hover:shadow-purple-500/10 h-full flex flex-col">
                                <div className="flex items-center justify-between">
                  <span className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-purple-400 to-blue-400 bg-clip-text text-transparent opacity-50">
                    {step.number}
                  </span>
                                    <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        {step.icon}
                                    </div>
                                </div>

                                <div className="space-y-2 md:space-y-3 flex-grow">
                                    <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
