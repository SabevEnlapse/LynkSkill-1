"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShieldCheck, ShieldAlert, Scan, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ScanStatus = "idle" | "scanning" | "safe" | "danger"

export function SecureDownloadDialog({
                                         selectedFile,
                                         onClose,
                                         onDownload,
                                     }: {
    selectedFile: { url: string } | null
    onClose: () => void
    onDownload: () => void
}) {
    const [scanStatus, setScanStatus] = useState<ScanStatus>("idle")
    const [scanProgress, setScanProgress] = useState(0)

    const startScan = () => {
        setScanStatus("scanning")
        setScanProgress(0)

        const interval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setScanStatus(Math.random() > 0.25 ? "safe" : "danger")
                    return 100
                }
                return prev + Math.random() * 12
            })
        }, 200)
    }

    const confirmDownload = () => {
        onDownload()
        onClose()
    }

    const fileName = selectedFile?.url.split("/").pop()

    return (
        <Dialog open={!!selectedFile} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted/40 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">Secure File Download</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        We’ll scan <span className="font-medium">{fileName}</span> for threats before you download.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {scanStatus === "idle" && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center space-y-4"
                            >
                                <div className="p-6 rounded-xl border border-border/50 bg-muted/30">
                                    <Scan className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">Ready to scan this file for security risks.</p>
                                </div>
                                <Button onClick={startScan} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                    Start Security Scan
                                </Button>
                            </motion.div>
                        )}

                        {scanStatus === "scanning" && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-3"
                            >
                                <div className="p-6 rounded-xl border border-border/50 bg-blue-50/70 dark:bg-blue-950/20">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="p-2 w-fit rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white mx-auto mb-3"
                                    >
                                        <Scan className="h-5 w-5" />
                                    </motion.div>
                                    <Progress value={scanProgress} className="h-2" />
                                    <p className="text-sm text-muted-foreground mt-2 text-center">Scanning for threats...</p>
                                </div>
                            </motion.div>
                        )}

                        {scanStatus === "safe" && (
                            <motion.div
                                key="safe"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3 text-green-600"
                            >
                                <div className="p-3 rounded-full bg-green-500 text-white">
                                    <ShieldCheck className="h-7 w-7" />
                                </div>
                                <p className="text-sm font-medium">File is safe. No threats detected.</p>
                            </motion.div>
                        )}

                        {scanStatus === "danger" && (
                            <motion.div
                                key="danger"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3 text-red-600"
                            >
                                <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white">
                                    <ShieldAlert className="h-7 w-7" />
                                </div>
                                <p className="text-sm font-medium">Warning: Suspicious content detected!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="flex justify-between mt-6">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">
                        <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>

                    {scanStatus === "safe" && (
                        <Button
                            onClick={confirmDownload}
                            className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                        >
                            Download Safely
                        </Button>
                    )}

                    {scanStatus === "danger" && (
                        <Button
                            onClick={confirmDownload}
                            className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                        >
                            Download Anyway
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
