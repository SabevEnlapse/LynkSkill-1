"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-6">
                    <div className="max-w-md w-full text-center space-y-8">
                        {/* Error icon */}
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-destructive/10 to-orange-500/10 flex items-center justify-center border border-destructive/30">
                                <AlertTriangle className="w-12 h-12 text-destructive" />
                            </div>
                        </div>

                        {/* Error content */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-foreground">
                                Something went wrong
                            </h1>
                            <p className="text-muted-foreground leading-relaxed">
                                We encountered an unexpected error. Please try again or return to the home page.
                            </p>
                        </div>

                        {/* Error details (development only) */}
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 text-left overflow-auto max-h-32">
                                <code className="text-xs text-destructive font-mono">
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.href = "/"}
                                className="gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        )
    }
}

/**
 * Simple error fallback component for inline use
 */
export function ErrorFallback({
    error,
    onRetry,
}: {
    error?: Error
    onRetry?: () => void
}) {
    return (
        <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Failed to load</h3>
                <p className="text-sm text-muted-foreground">
                    {error?.message || "An unexpected error occurred"}
                </p>
            </div>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-3 h-3" />
                    Retry
                </Button>
            )}
        </div>
    )
}
