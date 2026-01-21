import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { notifyExperienceGraded } from "@/lib/notifications"

// Endorsement types
interface EndorsementData {
    status: string
    skillsRating?: number      // 1-5
    impactRating?: number      // 1-5
    growthRating?: number      // 1-5
    recommendation?: string    // "highly_recommend" | "recommend" | "neutral" | "not_recommend"
    endorsementNote?: string
    grade?: number             // Legacy support
}

// Calculate legacy grade from new ratings (for backward compatibility)
function calculateLegacyGrade(skillsRating?: number, impactRating?: number, growthRating?: number): number | null {
    if (!skillsRating || !impactRating || !growthRating) return null
    // Average of ratings (1-5) mapped to grade (2-6)
    const avgRating = (skillsRating + impactRating + growthRating) / 3
    return Math.round(avgRating + 1) // 1-5 → 2-6
}

// Calculate skill score for leaderboard
export function calculateSkillScore(experience: {
    skillsRating?: number | null
    impactRating?: number | null
    growthRating?: number | null
    recommendation?: string | null
}): number {
    const skills = experience.skillsRating || 0
    const impact = experience.impactRating || 0
    const growth = experience.growthRating || 0
    
    // Recommendation bonus
    let recommendationBonus = 0
    switch (experience.recommendation) {
        case 'highly_recommend': recommendationBonus = 15; break
        case 'recommend': recommendationBonus = 10; break
        case 'neutral': recommendationBonus = 5; break
        case 'not_recommend': recommendationBonus = 0; break
    }
    
    // Weighted calculation: skills (40%) + impact (35%) + growth (25%) + recommendation bonus
    return Math.round((skills * 8) + (impact * 7) + (growth * 5) + recommendationBonus)
}

// PATCH /api/experience/[id] - Update experience status and endorsement
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log(" PATCH /api/experience/[id] called")

    try {
        const { userId } = await auth()
        if (!userId) {
            console.log(" Unauthorized - no userId")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        console.log(" Experience ID:", id)

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })

        if (!user || user.role !== "COMPANY") {
            console.log(" Forbidden - user is not a company")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json() as EndorsementData
        const { status, skillsRating, impactRating, growthRating, recommendation, endorsementNote, grade } = body
        console.log(" Request body:", body)

        const experience = await prisma.experience.findUnique({
            where: { id },
        })

        if (!experience) {
            console.log(" Experience not found")
            return NextResponse.json({ error: "Experience not found" }, { status: 404 })
        }

        if (!user.companies.some((c: { id: string }) => c.id === experience.companyId)) {
            console.log(" Forbidden - not company's experience")
            return NextResponse.json({ error: "Not your company's experience" }, { status: 403 })
        }

        // Validate endorsement data for approval
        if (status === "approved") {
            if (!skillsRating || !impactRating || !growthRating || !recommendation) {
                console.log(" Bad request - endorsement data required for approval")
                return NextResponse.json({ 
                    error: "Complete endorsement (skills, impact, growth ratings and recommendation) is required when approving" 
                }, { status: 400 })
            }
            
            // Validate rating ranges (1-5)
            if (skillsRating < 1 || skillsRating > 5 || impactRating < 1 || impactRating > 5 || growthRating < 1 || growthRating > 5) {
                return NextResponse.json({ error: "Ratings must be between 1 and 5" }, { status: 400 })
            }
        }

        // Calculate legacy grade for backward compatibility
        const calculatedGrade = status === "approved" 
            ? (grade ?? calculateLegacyGrade(skillsRating, impactRating, growthRating))
            : null

        console.log(" Updating experience with data:", {
            status,
            grade: calculatedGrade,
            skillsRating,
            impactRating,
            growthRating,
            recommendation,
            endorsementNote,
        })

        // Update experience - use simple update without include to avoid Prisma issues
        await prisma.experience.update({
            where: { id },
            data: {
                status,
                grade: calculatedGrade,
                skillsRating: status === "approved" ? skillsRating : null,
                impactRating: status === "approved" ? impactRating : null,
                growthRating: status === "approved" ? growthRating : null,
                recommendation: status === "approved" ? recommendation : null,
                endorsementNote: status === "approved" ? (endorsementNote || null) : null,
            },
        })

        // Fetch the updated experience with relations
        const updated = await prisma.experience.findUnique({
            where: { id },
            include: {
                student: true,
                company: true,
            },
        })

        if (!updated) {
            return NextResponse.json({ error: "Failed to fetch updated experience" }, { status: 500 })
        }

        // 📧 Notify student about experience endorsement
        if (status === "approved" && skillsRating && impactRating && growthRating) {
            const company = user.companies.find((c: { id: string }) => c.id === experience.companyId)
            const skillScore = calculateSkillScore({ skillsRating, impactRating, growthRating, recommendation })
            await notifyExperienceGraded(
                experience.studentId,
                company?.name || "Company",
                skillScore // Send skill score instead of grade
            )
        }

        console.log(" Experience updated successfully:", updated.id)
        return NextResponse.json(updated)
    } catch (error) {
        console.error(" PATCH /experience/[id] error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to update experience"
        return NextResponse.json({ error: errorMessage, details: String(error) }, { status: 500 })
    }
}
