import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const skills = searchParams.get("skills")?.split(",").filter(Boolean) || []

        // Fetch all students with their profiles and portfolios
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            include: {
                profile: true,
                portfolio: true,
                experiences: true,
                projects: true
            },
            take: 50
        })

        // Map and calculate match scores
        const candidates = students.map(student => {
            const studentSkillsArray = (student.portfolio?.skills || []).map((s: string) => s.toLowerCase())
            const studentInterests = (student.portfolio?.interests || []).map((s: string) => s.toLowerCase())
            const bio = (student.portfolio?.bio || "").toLowerCase()
            const headline = (student.portfolio?.headline || "").toLowerCase()
            const fullName = student.profile?.name || student.portfolio?.fullName || "Student"
            
            // Calculate a base score
            let score = 0
            const matchedSkills: string[] = []
            
            // If skills filter is provided, calculate match
            if (skills.length > 0) {
                for (const skill of skills) {
                    const skillLower = skill.toLowerCase()
                    if (studentSkillsArray.some(s => s.includes(skillLower) || skillLower.includes(s))) {
                        score += 30
                        matchedSkills.push(skill)
                    } else if (bio.includes(skillLower) || headline.includes(skillLower)) {
                        score += 15
                        matchedSkills.push(skill)
                    }
                }
            } else {
                // No filter - give base score based on profile completeness
                if (student.portfolio?.bio) score += 20
                if (student.portfolio?.headline) score += 15
                if (student.portfolio?.skills && student.portfolio.skills.length > 0) score += 25
                if (student.projects && student.projects.length > 0) score += 20
                if (student.experiences && student.experiences.length > 0) score += 20
            }

            // Cap at 98
            score = Math.min(score, 98)

            return {
                id: student.id,
                name: fullName,
                email: student.email || "",
                avatar: undefined,
                headline: student.portfolio?.headline || undefined,
                bio: student.portfolio?.bio || undefined,
                skills: student.portfolio?.skills || [],
                matchPercentage: score,
                matchedSkills,
                projectCount: student.projects?.length || 0,
                experienceCount: student.experiences?.length || 0
            }
        })

        // Filter by search term if provided
        let filteredCandidates = candidates
        if (search) {
            const searchLower = search.toLowerCase()
            filteredCandidates = candidates.filter(c => 
                c.name.toLowerCase().includes(searchLower) ||
                c.skills.some((s: string) => s.toLowerCase().includes(searchLower)) ||
                c.headline?.toLowerCase().includes(searchLower)
            )
        }

        // Sort by match percentage
        const sortedCandidates = filteredCandidates
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 20)

        return NextResponse.json({ candidates: sortedCandidates })

    } catch (error) {
        console.error("Error fetching candidates:", error)
        return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
    }
}
