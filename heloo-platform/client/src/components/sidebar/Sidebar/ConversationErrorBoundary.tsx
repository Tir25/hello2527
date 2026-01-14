/**
 * ConversationErrorBoundary Component
 * 
 * Error boundary for conversation list items.
 * Isolates crashes so one broken conversation doesn't crash the entire sidebar.
 * 
 * Responsibility: Error isolation for conversations
 * Layer: Error Boundary
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Props {
    children: ReactNode
    /** Fallback UI when error occurs */
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ConversationErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error('ConversationErrorBoundary', 'Caught error in conversation list', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        })
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: undefined })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-800">
                                Something went wrong
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Unable to display conversations
                            </p>
                            <button
                                onClick={this.handleRetry}
                                className="mt-3 flex items-center gap-1.5 text-xs font-medium 
                                          text-red-700 hover:text-red-800 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
