"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, AlertCircle, Upload, X, CheckCircle2, File } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface Assignment {
    id: string
    title: string
    description: string
    dueDate: string
    internshipTitle: string
    companyName: string
}

interface UploadedFile {
    id: string
    name: string
    size: number
    uploadedAt: Date
}

export default function AssignmentPage() {
    const params = useParams() as { id: string }
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    useEffect(() => {
        async function fetchAssignment() {
            if (!params?.id) return
            try {
                const res = await fetch(`/api/assignments/${params.id}`)
                if (!res.ok) throw new Error("Failed to fetch assignment")
                const data = await res.json()
                setAssignment(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load assignment")
            } finally {
                setLoading(false)
            }
        }

        fetchAssignment()
    }, [params?.id])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(Array.from(e.target.files))
        }
    }

    const handleFiles = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles])
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (files.length === 0) return
        setUploading(true)

        try {
            const formData = new FormData()
            files.forEach((file) => formData.append("files", file))

            const res = await fetch(`/api/assignments/${params.id}/upload`, {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                // 🧠 Get error info directly from backend
                const text = await res.text()
                console.error("❌ Upload failed:", res.status, res.statusText, text)
                throw new Error(`Upload failed (${res.status}): ${text}`)
            }

            const data = await res.json()
            console.log("✅ Upload success:", data)

            setUploadedFiles((prev) => [...prev, ...data.files])
            setFiles([])
        } catch (err) {
            console.error("🚨 Upload failed:", err)
            alert(err instanceof Error ? err.message : "Failed to upload files")
        } finally {
            setUploading(false)
        }
    }



    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-64 bg-slate-800/50 rounded-2xl" />
                        <div className="h-96 bg-slate-800/50 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-5xl mx-auto">
                    <Card className="rounded-2xl border-red-500/20 bg-slate-900/50">
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                            <h2 className="text-2xl font-semibold text-red-400 mb-2">Error Loading Assignment</h2>
                            <p className="text-slate-400">{error}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card
                        className="rounded-2xl border-2 overflow-hidden"
                        style={{
                            borderColor: "transparent",
                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))",
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent" />
                        <CardHeader className="relative z-10 pb-8">
                            <div className="flex items-start gap-4">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                                    <FileText className="h-8 w-8 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-3xl font-bold text-slate-100 mb-2 text-balance">
                                        {assignment.title}
                                    </CardTitle>
                                    <p className="text-base text-slate-400">
                                        For <span className="text-purple-400 font-medium">{assignment.internshipTitle}</span> at{" "}
                                        <span className="text-blue-400 font-medium">{assignment.companyName}</span>
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-400" />
                                Assignment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-purple-500/20">
                                        <Clock className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 font-medium">Due Date</p>
                                        <p className="text-lg font-semibold text-slate-200">
                                            {assignment.dueDate && !isNaN(new Date(assignment.dueDate).getTime())
                                                ? format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")
                                                : "No due date"}
                                        </p>

                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-blue-400" />
                                Submit Your Work
                            </CardTitle>
                            <p className="text-sm text-slate-400 mt-1">Upload your assignment files below</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Drag and drop area */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
                                    dragActive
                                        ? "border-purple-500 bg-purple-500/10"
                                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileInput}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="file-upload"
                                />
                                <div className="text-center space-y-4">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-slate-200 mb-1">
                                            Drop your files here, or <span className="text-purple-400">browse</span>
                                        </p>
                                        <p className="text-sm text-slate-500">Support for PDF, DOC, DOCX, ZIP, and more</p>
                                    </div>
                                </div>
                            </div>

                            {/* Selected files list */}
                            <AnimatePresence>
                                {files.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3"
                                    >
                                        <h4 className="text-sm font-medium text-slate-300">Selected Files ({files.length})</h4>
                                        <div className="space-y-2">
                                            {files.map((file, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 group hover:border-slate-600 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                                            <File className="h-5 w-5 text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                                                            <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(index)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={uploading}
                                            className="w-full h-12 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            style={{
                                                background: "linear-gradient(135deg, rgb(139, 92, 246), rgb(59, 130, 246))",
                                            }}
                                        >
                                            {uploading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Uploading...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Upload className="h-5 w-5" />
                                                    Submit Assignment
                                                </div>
                                            )}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Uploaded files history */}
                            {uploadedFiles.length > 0 && (
                                <div className="pt-6 border-t border-slate-800">
                                    <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                                        Previously Submitted ({uploadedFiles.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between p-4 rounded-lg bg-green-500/5 border border-green-500/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-green-500/10">
                                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">{file.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatFileSize(file.size)} • Uploaded{" "}
                                                            {file.uploadedAt && !isNaN(new Date(file.uploadedAt).getTime())
                                                                ? format(new Date(file.uploadedAt), "MMM d, yyyy 'at' h:mm a")
                                                                : "Unknown time"}
                                                        </p>

                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
