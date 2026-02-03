"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { sanitizeForDb, schemas } from "@/lib/security"
import { z } from "zod"

// Validation schemas for onboarding
const studentSchema = z.object({
    dob: schemas.dateOfBirth,
})

const companyFormSchema = z.object({
    companyName: schemas.companyName,
    companyDescription: schemas.description,
    companyLocation: schemas.location,
    companyEik: schemas.eik,
    companyWebsite: schemas.url.optional(),
    companyLogo: z.string().url().optional().nullable(),
})

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: "No logged in user" }

    // ✅ Require explicit role selection (no auto-student)
    const roleInput = (formData.get("role") as string)?.toLowerCase()
    if (!roleInput || !["student", "company"].includes(roleInput)) {
        return { error: "Please select a valid role before continuing." }
    }

    const role: "COMPANY" | "STUDENT" = roleInput === "company" ? "COMPANY" : "STUDENT"

    try {
        // Update Clerk metadata
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role, onboardingComplete: true },
        })

        // Get Clerk user info
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
                ?.emailAddress || ""

        // Ensure user exists and update onboarding state
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role, onboardingComplete: true },
            create: {
                clerkId: userId,
                email,
                role,
                onboardingComplete: true,
                profile: { create: { name: sanitizeForDb(clerkUser.firstName ?? ""), bio: "" } },
            },
        })

        // --- STUDENT FLOW ---
        if (role === "STUDENT") {
            const dob = formData.get("dob") as string

            // Validate student data
            const validation = studentSchema.safeParse({ dob })
            if (!validation.success) {
                return { error: validation.error.issues[0].message }
            }

            const age = calculateAge(new Date(dob))

            if (age < 16) {
                return { error: "You must be at least 16 years old to use this platform" }
            }

            const needsApproval = age < 18

            const portfolio = await prisma.portfolio.upsert({
                where: { studentId: user.id },
                update: {
                    age,
                    approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                    needsApproval,
                },
                create: {
                    studentId: user.id,
                    age,
                    approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                    needsApproval,
                    bio: "",
                    skills: [],
                    interests: [],
                    experience: "",
                    education: [],
                    projects: [],
                    certifications: [],
                },
            })

            return {
                message: "Student portfolio created or updated",
                createdPortfolioId: portfolio.id,
                dashboard: "/dashboard/student",
            }
        }

        // --- COMPANY FLOW ---
        if (role === "COMPANY") {
            const rawData = {
                companyName: formData.get("companyName") as string,
                companyDescription: formData.get("companyDescription") as string,
                companyLocation: formData.get("companyLocation") as string,
                companyEik: formData.get("companyEik") as string,
                companyWebsite: (formData.get("companyWebsite") as string) || null,
                companyLogo: (formData.get("companyLogoHidden") as string) || null,
            }

            // Validate and sanitize company data
            const validation = companyFormSchema.safeParse(rawData)
            if (!validation.success) {
                return { error: validation.error.issues[0].message }
            }

            const { companyName, companyDescription, companyLocation, companyEik, companyWebsite, companyLogo } = validation.data

            const existing = await prisma.company.findFirst({
                where: { ownerId: user.id },
            })

            let createdCompany

            if (!existing) {
                createdCompany = await prisma.company.create({
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite || null,
                        ownerId: user.id,
                        eik: companyEik,
                        logo: companyLogo || null,
                    },
                })

                // Create CompanyMember record for the owner with OWNER role
                await prisma.companyMember.create({
                    data: {
                        companyId: createdCompany.id,
                        userId: user.id,
                        defaultRole: "OWNER",
                        status: "ACTIVE",
                        invitedAt: new Date(),
                        joinedAt: new Date(),
                    },
                })
            } else {
                createdCompany = await prisma.company.update({
                    where: { id: existing.id },
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite || null,
                        eik: companyEik,
                        logo: companyLogo || existing.logo,
                    },
                })
            }

            // Force update Prisma role to COMPANY
            await prisma.user.update({
                where: { id: user.id },
                data: { role: "COMPANY" },
            })

            return {
                message: "Company onboarding complete",
                createdCompanyId: createdCompany.id,
                dashboard: "/dashboard/company",
            }
        }

        return { error: "Unknown role" }
    } catch (err) {
        console.error("❌ completeOnboarding error:", err)
        return { error: "Error completing onboarding. Please try again." }
    }
}


function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
}
