import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.json();
    const { clerkId, role, name } = body;

    try {
        const user = await prisma.user.create({
            data: {
                clerkId,
                role,
                profile: { create: { name } },
            },
        });
        return NextResponse.json({ message: "User created!", user });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
