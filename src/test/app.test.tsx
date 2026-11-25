import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { describe, expect, it } from 'vitest'

import App from '../App'
import { i18n } from '../i18n'

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
  it('renders the navigation shell instead of an empty page', async () => {
    renderApp()

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getAllByText('Sonicly').length).toBeGreaterThan(0)

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /Слушай музыку/i })).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: /Войти/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Войти через аккаунт/i })).toBeInTheDocument()
  })
})
