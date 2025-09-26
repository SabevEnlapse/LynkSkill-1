"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileImage, FileVideo, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type RecentFile = {
    url: string
    createdAt: string
}

export function RecentFilesSection() {
    const [files, setFiles] = useState<RecentFile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch("/api/experience/recent-files")
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to fetch recent files")
                setFiles(data)
            } catch (err) {
                console.error("RecentFilesSection error:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFiles()
    }, [])


    const getFileIcon = (url: string) =>
        url.match(/\.(mp4|mov|avi)$/) ? (
            <FileVideo className="h-5 w-5 text-blue-500" />
        ) : (
            <FileImage className="h-5 w-5 text-green-500" />
        )

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Recent Files</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {loading ? (
                    <p className="text-muted-foreground">Loading files...</p>
                ) : files.length === 0 ? (
                    <p className="text-muted-foreground">No files uploaded yet</p>
                ) : (
                    files.map((file, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }}>
                            <Card className="overflow-hidden rounded-2xl">
                                <CardContent className="flex flex-col items-center gap-2 p-4">
                                    {getFileIcon(file.url)}
                                    <span className="truncate text-sm max-w-[150px]">{file.url.split("/").pop()}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => window.open(file.url, "_blank")}
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </section>
    )
}
