import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ErrorBoundaryProps {
  children: ReactNode
  /**
   * The route that is open. When it changes, the boundary forgets the error,
   * so a page that breaks does not follow the visitor through the app.
   */
  resetKey?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Route error', error, info)
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (!this.state.hasError) return
    if (previous.resetKey === this.props.resetKey) return

    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) return <RouteError />

    return this.props.children
  }
}

const RouteError = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl glass border border-white/10 px-6 py-16 text-center">
      <span className="text-3xl" aria-hidden="true">
        ⚠
      </span>
      <div>
        <p className="font-semibold">{t('error.generic')}</p>
        <p className="mt-1 text-sm text-muted">{t('error.notFound')}</p>
      </div>
      <button
        type="button"
        onClick={() => window.location.assign('/')}
        className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-spring hover:opacity-90"
      >
        {t('nav.home')}
      </button>
    </div>
  )
}
