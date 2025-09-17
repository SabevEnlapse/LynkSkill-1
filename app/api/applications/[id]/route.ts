import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const companyUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!companyUser) return NextResponse.json({ error: "Company not found" }, { status: 404 });

        const { status } = await req.json();
        if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

        const application = await prisma.application.update({
            where: { id: params.id },
            data: { status },
        });

        return NextResponse.json(application);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}
