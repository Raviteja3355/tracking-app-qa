'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  /** No fallback (default) = silent failure, renders nothing */
  fallback?: ReactNode | ((reset: () => void) => ReactNode)
  onError?: (error: Error, info: ErrorInfo) => void
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (fallback === undefined) return null
      if (typeof fallback === 'function') return fallback(this.reset)
      return fallback
    }
    return this.props.children
  }
}
