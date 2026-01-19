import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

type ChatPhase = "intro" | "gathering" | "portfolio" | "matching" | "results"

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

// System prompts for different modes
const STUDENT_SYSTEM_PROMPT = `You are an AI Career Assistant helping students build their professional portfolio and find matching internships.

Your tasks:
1. GATHERING PHASE: Ask questions to understand the student better:
   - What are their skills (programming languages, tools, frameworks)?
   - What field are they interested in (web development, data science, design, etc.)?
   - What is their educational background?
   - Do they have any projects or experience?
   - What are their career goals?

2. PORTFOLIO PHASE: Once you have enough info, generate a professional portfolio including:
   - A compelling headline (e.g., "Aspiring Full-Stack Developer | React & Node.js Enthusiast")
   - An about section (2-3 sentences, professional and engaging)
   - List of key skills
   - Career interests

3. MATCHING PHASE: After portfolio is generated, you'll help match them with internships.

IMPORTANT:
- Be friendly but professional
- Ask follow-up questions if answers are vague
- When you have enough information (at least: skills, interests, and some background), transition to portfolio generation
- Output JSON when generating portfolio with format: {"type": "portfolio", "data": {headline, about, skills: [], interests: []}}
- When ready for matching, output: {"type": "ready_for_matching"}

Current conversation phase: {phase}

If you need to transition phases, include in your response:
- To move to portfolio: Add [PHASE:portfolio] at the end
- To move to matching: Add [PHASE:matching] at the end`

const COMPANY_SYSTEM_PROMPT = `You are an AI Talent Scout helping companies find the perfect candidates for their team.

Your tasks:
1. GATHERING PHASE: Understand what the company is looking for:
   - What skills are required?
   - What type of role (internship, entry-level)?
   - What field (web dev, data science, design, etc.)?
   - Any specific requirements or preferences?
   - What is the company culture like?

2. MATCHING PHASE: Once you understand their needs, search for matching students.

IMPORTANT:
- Be helpful and professional
- Ask clarifying questions to better understand their needs
- Help them articulate what they're looking for if they're unsure
- When you have enough info to search (at least: required skills and role type), transition to matching
- Output when ready: {"type": "ready_for_search", "criteria": {skills: [], roleType, field, requirements: []}}

Current conversation phase: {phase}

If you need to transition phases, include:
- To move to matching: Add [PHASE:matching] at the end`

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { message, conversationHistory, phase, userType } = body as {
            message: string
            conversationHistory: ConversationMessage[]
            phase: ChatPhase
            userType: "student" | "company"
        }

        // Build conversation for OpenAI
        const systemPrompt = userType === "student" 
            ? STUDENT_SYSTEM_PROMPT.replace("{phase}", phase)
            : COMPANY_SYSTEM_PROMPT.replace("{phase}", phase)

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content
            })),
            { role: "user", content: message }
        ]

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        })

        let reply = completion.choices[0]?.message?.content || "I apologize, I couldn't process that. Please try again."
        let newPhase = phase
        let responseData: Record<string, unknown> = {}

        // Check for phase transitions
        if (reply.includes("[PHASE:portfolio]")) {
            newPhase = "portfolio"
            reply = reply.replace("[PHASE:portfolio]", "").trim()
        } else if (reply.includes("[PHASE:matching]")) {
            newPhase = "matching"
            reply = reply.replace("[PHASE:matching]", "").trim()
        }

        // Check for JSON output in reply
        const jsonMatch = reply.match(/\{[\s\S]*?"type"[\s\S]*?\}/g)
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[jsonMatch.length - 1])
                responseData = jsonData
                
                // Handle portfolio generation for students
                if (jsonData.type === "portfolio" && userType === "student") {
                    newPhase = "matching"
                    
                    // Fetch matching internships
                    const matches = await findMatchingInternships(jsonData.data?.skills || [], jsonData.data?.interests || [])
                    
                    return NextResponse.json({
                        reply: reply.replace(jsonMatch[jsonMatch.length - 1], "").trim() + 
                               "\n\n✨ I've generated your portfolio! Now let me find internships that match your profile...",
                        phase: "results",
                        portfolio: jsonData.data,
                        matches,
                        type: "portfolio_generated"
                    })
                }

                // Handle student search for companies
                if (jsonData.type === "ready_for_search" && userType === "company") {
                    newPhase = "results"
                    
                    // Fetch matching students
                    const matches = await findMatchingStudents(jsonData.criteria?.skills || [], jsonData.criteria?.field || "")
                    
                    return NextResponse.json({
                        reply: "🔍 I've searched our database and found some great candidates for you! Here are the students that best match your requirements:",
                        phase: "results",
                        matches,
                        type: "search_complete"
                    })
                }

                // Handle ready for matching (student)
                if (jsonData.type === "ready_for_matching" && userType === "student") {
                    newPhase = "matching"
                }
            } catch (_e) {
                // JSON parsing failed, continue normally
            }
        }

        // If in matching phase and we have enough context, auto-fetch matches
        if (newPhase === "matching" && userType === "student") {
            // Extract skills from conversation
            const skills = extractSkillsFromConversation(conversationHistory, message)
            if (skills.length > 0) {
                const matches = await findMatchingInternships(skills, [])
                return NextResponse.json({
                    reply: reply + "\n\n🎯 Based on your profile, I found some internships that might interest you!",
                    phase: "results",
                    matches,
                    type: "matches_found"
                })
            }
        }

        return NextResponse.json({
            reply,
            phase: newPhase,
            ...responseData
        })

    } catch (error) {
        console.error("AI Mode API Error:", error)
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        )
    }
}

// Helper function to find matching internships for students
async function findMatchingInternships(skills: string[], interests: string[]) {
    try {
        const internships = await prisma.internship.findMany({
            include: {
                company: {
                    select: {
                        name: true,
                        logo: true
                    }
                }
            },
            take: 20
        })

        // Calculate match scores
        const matches = internships.map(internship => {
            let score = 0
            const reasons: string[] = []

            // Match by skills in title or description
            const internshipText = `${internship.title} ${internship.description}`.toLowerCase()
            
            for (const skill of skills) {
                if (internshipText.includes(skill.toLowerCase())) {
                    score += 20
                    reasons.push(`Matches your ${skill} skills`)
                }
            }

            // Match by interests
            for (const interest of interests) {
                if (internshipText.includes(interest.toLowerCase())) {
                    score += 15
                    reasons.push(`Aligns with your interest in ${interest}`)
                }
            }

            // Base score for active internships
            score += 10

            // Cap at 100
            score = Math.min(score, 98)

            // Ensure minimum score for variety
            if (score < 30) score = Math.floor(Math.random() * 30) + 25

            return {
                id: internship.id,
                title: internship.title,
                company: internship.company?.name || "Company",
                logo: internship.company?.logo,
                description: internship.description?.substring(0, 150) + "...",
                matchPercentage: score,
                reasons: reasons.length > 0 ? reasons : ["Potential learning opportunity"]
            }
        })

        // Sort by match percentage
        return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 10)

    } catch (error) {
        console.error("Error finding internships:", error)
        return []
    }
}

// Helper function to find matching students for companies
async function findMatchingStudents(requiredSkills: string[], field: string) {
    try {
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
            take: 30
        })

        // Calculate match scores
        const matches = students.map(student => {
            let score = 0
            const reasons: string[] = []
            const foundSkills: string[] = []

            // Get student's full text for matching
            const portfolioSkills = student.portfolio?.skills?.join(" ") || ""
            const portfolioInterests = student.portfolio?.interests?.join(" ") || ""
            const studentText = `${student.portfolio?.bio || ""} ${student.portfolio?.headline || ""} ${portfolioSkills} ${portfolioInterests} ${
                student.portfolio?.experience || ""
            } ${student.projects?.map((p: { title: string; description: string }) => `${p.title} ${p.description}`).join(" ") || ""}`.toLowerCase()

            // Match by required skills
            for (const skill of requiredSkills) {
                if (studentText.includes(skill.toLowerCase())) {
                    score += 25
                    foundSkills.push(skill)
                    reasons.push(`Has ${skill} experience`)
                }
            }

            // Match by field
            if (field && studentText.includes(field.toLowerCase())) {
                score += 15
                reasons.push(`Interested in ${field}`)
            }

            // Bonus for having portfolio
            if (student.portfolio?.bio) {
                score += 10
                reasons.push("Has complete portfolio")
            }

            // Bonus for having projects
            if (student.projects && student.projects.length > 0) {
                score += 10
                reasons.push(`${student.projects.length} project(s)`)
            }

            // Cap at 100
            score = Math.min(score, 98)

            // Minimum score for variety
            if (score < 25) score = Math.floor(Math.random() * 25) + 20

            return {
                id: student.id,
                name: student.profile?.name || student.portfolio?.fullName || "Student",
                email: student.email || "",
                matchPercentage: score,
                reasons: reasons.length > 0 ? reasons : ["Potential candidate"],
                skills: foundSkills.length > 0 ? foundSkills : ["Available for internship"],
                portfolio: {
                    headline: student.portfolio?.headline || undefined,
                    about: student.portfolio?.bio || undefined
                }
            }
        })

        // Sort by match percentage
        return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 10)

    } catch (error) {
        console.error("Error finding students:", error)
        return []
    }
}

// Extract skills from conversation history
function extractSkillsFromConversation(history: ConversationMessage[], latestMessage: string): string[] {
    const allText = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()
    
    const commonSkills = [
        "javascript", "typescript", "python", "java", "react", "vue", "angular",
        "node", "nodejs", "express", "django", "flask", "spring", "sql", "mongodb",
        "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes",
        "git", "html", "css", "sass", "tailwind", "figma", "design", "ui", "ux",
        "machine learning", "ml", "ai", "data science", "data analysis",
        "marketing", "sales", "communication", "leadership", "project management",
        "agile", "scrum", "devops", "testing", "qa", "security", "blockchain",
        "mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"
    ]

    const foundSkills: string[] = []
    for (const skill of commonSkills) {
        if (allText.includes(skill) && !foundSkills.includes(skill)) {
            foundSkills.push(skill)
        }
    }

    return foundSkills
}
