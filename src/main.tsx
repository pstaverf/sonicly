import { StrictMode, useEffect } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query'
import type { DehydratedState } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { HelmetProvider } from 'react-helmet-async'

import { i18n, detectBrowserLanguage } from './i18n'
import { hasPersistedLanguage, useStore } from './store'
import App from './App'
import '@fontsource-variable/manrope'
import './styles/index.css'

const readInitialState = (): DehydratedState | undefined => {
  const raw = window.__SONICLY_STATE__
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as DehydratedState
  } catch {
    return undefined
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const AppShell = () => {
  const language = useStore((state) => state.language)
  const setLanguage = useStore((state) => state.setLanguage)

  useEffect(() => {
    const target = hasPersistedLanguage() ? language : detectBrowserLanguage()

    if (target !== language) {
      setLanguage(target)
    }

    if (i18n.language !== target) {
      void i18n.changeLanguage(target)
    }
  }, [language, setLanguage])

  return <App />
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element #root not found')
}

const initialState = readInitialState()

const tree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <HelmetProvider>
          <BrowserRouter>
            {initialState ? (
              <HydrationBoundary state={initialState}>
                <AppShell />
              </HydrationBoundary>
            ) : (
              <AppShell />
            )}
          </BrowserRouter>
        </HelmetProvider>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>
)

if (root.hasChildNodes()) {
  hydrateRoot(root, tree)
} else {
  createRoot(root).render(tree)
}
