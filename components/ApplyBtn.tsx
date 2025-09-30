"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ApplyButtonProps {
    internshipId: string
    onApplied?: () => void
}

export default function ApplyButton({ internshipId, onApplied }: ApplyButtonProps) {
    const [loading, setLoading] = useState(false)
    const [applied, setApplied] = useState(false)

    async function handleApply() {
        setLoading(true)
        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internshipId }),
            })
            if (res.ok) {
                setApplied(true)
                onApplied?.()
            } else {
                console.error("Failed to apply")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            className="flex-1 rounded-2xl font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
            style={{
                background:
                    "linear-gradient(135deg, var(--internship-modal-gradient-from), var(--internship-modal-gradient-to))",
                boxShadow: "0 10px 25px -5px color-mix(in oklch, var(--internship-modal-gradient-from) 20%, transparent)",
            }}
            disabled={loading || applied}
            onClick={handleApply}
        >
            {applied ? "Applied" : loading ? "Applying..." : "Apply"}
        </Button>
    )
}
