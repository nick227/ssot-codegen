/**
 * ErrorBoundary
 * 
 * Catches rendering errors and displays user-friendly error UI.
 */

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Template rendering error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-error-50 border border-error-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-error-900 mb-4">
              Rendering Error
            </h1>
            <p className="text-error-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

