/**
 * Story Error Boundary
 * Catches errors in story viewer components to prevent white screen
 * 
 * @module components/stories/viewer/StoryErrorBoundary
 */

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
    children: ReactNode
    /** Called when error occurs - use to skip to next story */
    onError?: () => void
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * Error boundary for story viewer components
 * Shows error UI instead of white screen when a component crashes
 */
export class StoryErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('StoryErrorBoundary caught:', error, errorInfo)
    }

    handleSkip = () => {
        this.setState({ hasError: false, error: null })
        this.props.onError?.()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="bg-red-500/20 p-4 rounded-full">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">
                        Something went wrong
                    </h3>
                    <p className="text-white/60 text-sm max-w-xs">
                        This story couldn&apos;t be displayed properly.
                    </p>
                    <button
                        onClick={this.handleSkip}
                        className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                    >
                        Skip to next
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
