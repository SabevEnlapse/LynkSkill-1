import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await prisma.user.update({
        where: { clerkId: userId },
        data: { introShown: true },
    })

    return NextResponse.json({ success: true })
}
