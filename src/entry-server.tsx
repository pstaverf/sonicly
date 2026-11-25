import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'

import { i18n } from './i18n'
import { fetchAlbum, fetchPlaylist, fetchTracks } from './api'
import App from './App'

const resolveSlug = (url: string): { section: string; slug: string } | null => {
  const match = /^\/(album|playlist)\/([^/?#]+)/.exec(url)
  if (!match) return null
  return { section: match[1], slug: match[2] }
}

export const render = async (url: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, retry: 0, gcTime: Infinity },
    },
  })

  await queryClient.prefetchQuery({ queryKey: ['tracks'], queryFn: fetchTracks })

  const slug = resolveSlug(url)
  if (slug?.section === 'album') {
    await queryClient.prefetchQuery({
      queryKey: ['album', slug.slug],
      queryFn: () => fetchAlbum(slug.slug),
    })
  }
  if (slug?.section === 'playlist') {
    await queryClient.prefetchQuery({
      queryKey: ['playlist', slug.slug],
      queryFn: () => fetchPlaylist(slug.slug),
    })
  }

  const helmetContext: { helmet?: HelmetServerState | null } = {}

  const html = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <HelmetProvider context={helmetContext}>
            <StaticRouter location={url}>
              <HydrationBoundary state={dehydrate(queryClient)}>
                <App />
              </HydrationBoundary>
            </StaticRouter>
          </HelmetProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </StrictMode>,
  )

  const helmet = helmetContext.helmet

  const head = helmet
    ? [
        helmet.title?.toString() ?? '',
        helmet.meta?.toString() ?? '',
        helmet.link?.toString() ?? '',
        helmet.script?.toString() ?? '',
      ]
        .filter(Boolean)
        .join('\n    ')
    : ''

  const state = dehydrate(queryClient)

  return { html, head, state }
}
