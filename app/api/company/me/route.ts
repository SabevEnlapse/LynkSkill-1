import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyByClerkId } from "@/lib/permissions"

export const runtime = "nodejs"
export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
    const { userId: clerkId } = await auth()
    if (!clerkId) return new Response("Unauthorized", { status: 401 })

    // First try to get company via membership
    const membership = await getUserCompanyByClerkId(clerkId)
    if (membership) {
        const company = await prisma.company.findUnique({
            where: { id: membership.companyId },
            select: { id: true, name: true, logo: true },
        })
        if (company) {
            return Response.json(company)
        }
    }

    // Fallback: check if user is company owner (for backward compatibility)
    const company = await prisma.company.findFirst({
        where: { owner: { clerkId } },
        select: { id: true, name: true, logo: true },
    })

    if (!company) {
        return Response.json({ error: "Company not found" }, { status: 404 })
    }

    return Response.json(company)
}
