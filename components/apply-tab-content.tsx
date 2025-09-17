"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Application } from "@/app/types"

interface ApplicationsTabContentProps {
  userType: "Student" | "Company"
}

export function ApplicationsTabContent({ userType }: ApplicationsTabContentProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadApplications() {
      const url =
          userType === "Student"
              ? "/api/applications/me"
              : "/api/applications/company"

      const res = await fetch(url)
      if (res.ok) {
        const data: Application[] = await res.json()
        setApplications(data)
      }
      setLoading(false)
    }
    loadApplications()
  }, [userType])

  async function updateApplication(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApplications((prev) =>
          prev.map((app) =>
              app.id === id ? { ...app, status } : app
          )
      )
    }
  }

  if (loading) return <p>Loading...</p>

  return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {userType === "Student" ? "My Applications" : "Received Applications"}
          </h2>
        </div>

        <div className="rounded-3xl border overflow-hidden">
          {/* Header row */}
          <div className="bg-muted/50 p-3 hidden md:grid md:grid-cols-12 text-sm font-medium">
            <div className="col-span-4">Internship</div>
            <div className="col-span-4">
              {userType === "Student" ? "Company" : "Student"}
            </div>
            <div className="col-span-4">Status</div>
          </div>

          <div className="divide-y">
            {applications.map((app) => (
                <motion.div
                    key={app.id}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    className="p-3 md:grid md:grid-cols-12 items-center flex flex-col md:flex-row gap-3 md:gap-0"
                >
                  {/* Internship title */}
                  <div className="col-span-4">
                    <p className="font-medium">{app.internship?.title}</p>
                  </div>

                  {/* Company name (for student) OR student name (for company) */}
                  <div className="col-span-4">
                    {userType === "Student"
                        ? app.internship?.company?.name ?? "Unknown company"
                        : app.student?.profile?.name ??
                        app.student?.email ??
                        app.studentId}
                  </div>

                  {/* Status + actions */}
                  <div className="col-span-4 flex items-center gap-2">
                <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        app.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : app.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {app.status}
                </span>

                    {userType === "Company" && app.status === "PENDING" && (
                        <>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateApplication(app.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplication(app.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </>
                    )}
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </section>
  )
}
