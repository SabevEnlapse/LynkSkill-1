import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing internship ID" }, { status: 400 });
        }

        await prisma.internship.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Internship deleted successfully" });
    } catch (err) {
        console.error("Delete internship error:", err);
        return NextResponse.json({ error: "Failed to delete internship" }, { status: 500 });
    }
}
