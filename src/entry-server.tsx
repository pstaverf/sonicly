import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'

import { i18n } from './i18n'
import {
  fetchAlbum,
  fetchArtist,
  fetchArtists,
  fetchAlbums,
  fetchChart,
  fetchGenrePage,
  fetchNewReleases,
  fetchPlaylist,
  fetchPlaylistsOfDay,
  fetchPopular,
  fetchTrack,
} from './api/fetchers'
import { genreBySlug } from './api/genres'
import App from './App'

const ROUTE_PATTERN = /^\/(album|playlist|artist|track|genre)\/([^/?#]+)/

export const resolveRoute = (
  url: string,
): { section: string; slug: string } | null => {
  const match = ROUTE_PATTERN.exec(url)
  if (!match) return null
  return { section: match[1], slug: match[2] }
}

export const render = async (url: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, retry: 0, gcTime: Infinity },
    },
  })

  const route = resolveRoute(url)

  if (!route) {
    await Promise.allSettled([
      queryClient.prefetchQuery({ queryKey: ['home', 'new'], queryFn: () => fetchNewReleases() }),
      queryClient.prefetchQuery({ queryKey: ['home', 'popular'], queryFn: () => fetchPopular() }),
      queryClient.prefetchQuery({ queryKey: ['home', 'chart'], queryFn: () => fetchChart() }),
      queryClient.prefetchQuery({
        queryKey: ['home', 'playlists'],
        queryFn: () => fetchPlaylistsOfDay(),
      }),
      queryClient.prefetchQuery({ queryKey: ['home', 'albums'], queryFn: () => fetchAlbums() }),
      queryClient.prefetchQuery({ queryKey: ['home', 'artists'], queryFn: () => fetchArtists() }),
    ])
  } else {
    if (route.section === 'album') {
      await queryClient.prefetchQuery({
        queryKey: ['album', route.slug],
        queryFn: () => fetchAlbum(route.slug),
      })
    }

    if (route.section === 'playlist') {
      await queryClient.prefetchQuery({
        queryKey: ['playlist', route.slug],
        queryFn: () => fetchPlaylist(route.slug),
      })
    }

    if (route.section === 'artist') {
      await queryClient.prefetchQuery({
        queryKey: ['artist', route.slug],
        queryFn: () => fetchArtist(route.slug),
      })
    }

    if (route.section === 'track') {
      await queryClient.prefetchQuery({
        queryKey: ['track', route.slug],
        queryFn: () => fetchTrack(route.slug),
      })
    }

    if (route.section === 'genre') {
      const genre = genreBySlug(route.slug)
      if (genre) {
        await queryClient.prefetchInfiniteQuery({
          queryKey: ['genre', genre.tag],
          queryFn: ({ pageParam }) => fetchGenrePage(genre.tag, pageParam as number),
          initialPageParam: 0,
          getNextPageParam: () => undefined,
          pages: 1,
        })
      }
    }
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
