'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface ReactError31BoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ReactError31BoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Specialized error boundary for catching and handling React error #31
 * "Objects are not valid as a React child"
 */
export class ReactError31Boundary extends Component<ReactError31BoundaryProps, ReactError31BoundaryState> {
  constructor(props: ReactError31BoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ReactError31BoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if this is React error #31
    const isReactError31 = error.message.includes('Objects are not valid as a React child') ||
                          error.message.includes('$$typeof') ||
                          error.message.includes('displayName') ||
                          error.message.includes('render')

    if (isReactError31) {
      // Enhanced logging for debugging
      logger.error('React Error #31 caught by boundary', {
        errorName: error.name,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        reactError31: true,
        timestamp: new Date().toISOString()
      }, error)

      // Try to extract more details about what caused the error
      this.analyzeErrorContext(error, errorInfo)
    } else {
      // Log other React errors differently
      logger.error('React error caught by ReactError31Boundary', {
        errorName: error.name,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        reactError31: false
      }, error)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  private analyzeErrorContext(error: Error, errorInfo: React.ErrorInfo) {
    const componentStack = errorInfo.componentStack || ''

    // Try to identify which component caused the issue
    const stackLines = componentStack.split('\n')
    const adminComponents = stackLines.filter(line =>
      line.includes('admin') ||
      line.includes('PageHeader') ||
      line.includes('ActionItem') ||
      line.includes('StandardPage') ||
      line.includes('AnalyticsPage')
    )

    logger.debug('React Error #31 analysis details', {
      likelySource: adminComponents.length > 0 ? adminComponents[0] : 'Unknown',
      relevantStackLines: adminComponents,
      errorOrigin: this.extractErrorOrigin(error.stack || ''),
      suggestedFix: 'Check for JSX elements passed as icon props instead of component references'
    })
  }

  private extractErrorOrigin(stack: string): string {
    const lines = stack.split('\n')
    const relevantLine = lines.find(line => 
      line.includes('/admin/') || 
      line.includes('PageHeader') ||
      line.includes('ActionItem')
    )
    return relevantLine || 'Unknown origin'
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return <ReactError31Fallback error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

function ReactError31Fallback({ error, resetError }: ErrorFallbackProps) {
  const isReactError31 = error.message.includes('Objects are not valid as a React child')

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          {isReactError31 ? 'Component Rendering Error' : 'React Error'}
        </h3>
        
        <p className="text-red-700 mb-4 text-sm">
          {isReactError31 
            ? 'A component object was passed where a React element was expected. This usually happens when passing JSX elements as props instead of component references.'
            : 'An unexpected React error occurred while rendering this component.'
          }
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
              <div className="font-semibold">{error.name}: {error.message}</div>
              {error.stack && (
                <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReactError31Boundary
