"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SaveUser() {
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                email: user.emailAddresses[0]?.emailAddress, // optional chaining
                role: "STUDENT", // you can make this dynamic later
            }),
        });
    }, [user]);

    return null;
}
