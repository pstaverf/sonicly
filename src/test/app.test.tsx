import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { i18n } from '../i18n'

const emptyResponse = (results: unknown[] = []) => ({
  ok: true,
  status: 200,
  json: async () => ({ headers: {}, results, data: results }),
})

const renderApp = (route = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  )
}

describe('sonicly application shell', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => emptyResponse()),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the navigation shell instead of an empty page', async () => {
    renderApp()

    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sonicly').length).toBeGreaterThan(0)

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /слушай музыку/i })).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('applies the persisted theme class to the document element', async () => {
    renderApp()

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('renders the search page with a search field', async () => {
    renderApp('/search')

    const input = await screen.findByRole('searchbox', undefined, { timeout: 5000 })
    expect(input).toBeInTheDocument()
    expect(i18n.isInitialized).toBe(true)
  })

  it('renders the library page', async () => {
    renderApp('/library')

    expect(await screen.findByRole('heading', { name: /Моя коллекция/i })).toBeInTheDocument()
  })

  it('renders the login page with a guest entry point', async () => {
    renderApp('/login')

    expect(await screen.findByRole('heading', { name: /Войти в Sonicly/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Продолжить как гость/i }).length).toBeGreaterThan(0)
  })

  it('shows an honest error state when the api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline')
      }),
    )

    renderApp()

    await waitFor(
      () => {
        expect(screen.getAllByText(/Не удалось загрузить/i).length).toBeGreaterThan(0)
      },
      { timeout: 5000 },
    )
  })
})
