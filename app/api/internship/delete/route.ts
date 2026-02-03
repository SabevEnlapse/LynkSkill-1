import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Permission } from "@prisma/client";
import { getUserCompanyByClerkId, checkPermission } from "@/lib/permissions";

export async function DELETE(req: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get ID from URL query instead of req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Missing internship ID" },
                { status: 400 }
            );
        }

        // Get internship to check company ownership
        const internship = await prisma.internship.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!internship) {
            return NextResponse.json(
                { error: "Internship not found" },
                { status: 404 }
            );
        }

        // Get user's company membership
        const membership = await getUserCompanyByClerkId(clerkId);
        if (!membership || membership.companyId !== internship.companyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check DELETE_INTERNSHIP permission
        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.DELETE_INTERNSHIPS
        );
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to delete internships" },
                { status: 403 }
            );
        }

        // Check if internship has applications
        const linkedApplications = await prisma.application.count({
            where: { internshipId: id },
        });

        if (linkedApplications > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete internship because students have already applied."
                },
                { status: 400 }
            );
        }

        // Delete internship
        await prisma.internship.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Internship deleted successfully" });

    } catch (err) {
        console.error("Delete internship error:", err);
        return NextResponse.json(
            { error: "Failed to delete internship" },
            { status: 500 }
        );
    }
}
