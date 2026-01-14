import { Component, type ReactNode } from 'react'
import GlassCard from './GlassCard'
import Button from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, resetError: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
          {/* Subtle background orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-md">
            <GlassCard variant="elevated" className="p-8 bg-white/90 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{this.state.error.message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={this.resetError} variant="primary">
                  Try again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="secondary"
                >
                  Go home
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
