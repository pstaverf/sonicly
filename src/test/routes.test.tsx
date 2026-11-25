import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

const track = {
  id: '123456',
  name: 'Jamendo Track',
  duration: 210,
  artist_id: '42',
  artist_name: 'Test Artist',
  album_name: 'Test Album',
  album_id: '77',
  audio: 'https://mp3l.jamendo.com/?trackid=123456',
  releasedate: '2024-01-15',
  image: 'https://prod-1.storage.jamendo.com/?trackid=123456',
  shareurl: 'https://www.jamendo.com/track/123456',
  musicinfo: { tags: { genres: ['rock'] } },
  license_ccurl: 'https://creativecommons.org/licenses/by/3.0/',
}

const album = {
  id: '145774',
  name: 'Test Album',
  artist_id: '42',
  artist_name: 'Test Artist',
  releasedate: '2024-01-15',
  image: 'https://prod-1.storage.jamendo.com/?albumid=145774',
  shareurl: 'https://www.jamendo.com/album/145774',
}

const artist = {
  id: '42',
  name: 'Test Artist',
  website: 'https://artist.test',
  joindate: '2020-01-01',
  image: 'https://prod-1.storage.jamendo.com/?artistid=42',
  shareurl: 'https://www.jamendo.com/artist/42',
}

const playlist = {
  id: '11696',
  name: 'Test Playlist',
  creationdate: '2024-02-02',
  user_id: '7',
  user_name: 'Curator',
  shareurl: 'https://www.jamendo.com/playlist/11696',
  tracks: [track],
}

const headers = { results_count: 1 }

/**
 * The api answers by the shape of the request, so every route of the app can
 * be rendered with the data it really gets from jamendo.
 */
const respond = (url: string) => {
  const target = new URL(url)
  const path = target.pathname

  if (path.includes('api.audius.co')) {
    return { data: [] }
  }

  if (path.endsWith('/playlists/tracks')) {
    return { headers, results: [{ ...playlist, tracks: [{ ...track, album_name: undefined }] }] }
  }

  if (path.endsWith('/playlists')) {
    return { headers, results: [playlist] }
  }

  if (path.endsWith('/albums')) {
    return { headers, results: [album] }
  }

  if (path.endsWith('/artists')) {
    return { headers, results: [artist] }
  }

  if (path.endsWith('/tracks')) {
    return { headers, results: [track] }
  }

  return { headers, results: [] }
}

const renderApp = (route: string) => {
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

describe('every route renders', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => respond(String(url)),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the album of a slug', async () => {
    renderApp('/album/test-album-jamendo-145774')

    expect(await screen.findByRole('heading', { name: 'Test Album' })).toBeInTheDocument()
    expect((await screen.findAllByText('Jamendo Track')).length).toBeGreaterThan(0)
  })

  it('opens the playlist of a slug', async () => {
    renderApp('/playlist/test-playlist-jamendo-11696')

    expect(await screen.findByRole('heading', { name: 'Test Playlist' })).toBeInTheDocument()
    expect((await screen.findAllByText('Jamendo Track')).length).toBeGreaterThan(0)
  })

  it('opens the artist of a slug', async () => {
    renderApp('/artist/test-artist-jamendo-42')

    expect(await screen.findByRole('heading', { name: 'Test Artist' })).toBeInTheDocument()
    expect((await screen.findAllByText('Jamendo Track')).length).toBeGreaterThan(0)
  })

  it('opens the track of a slug', async () => {
    renderApp('/track/jamendo-track-jamendo-123456')

    expect(await screen.findByRole('heading', { name: 'Jamendo Track' })).toBeInTheDocument()
  })

  it('keeps the shell alive on an unknown route', async () => {
    renderApp('/does-not-exist')

    await waitFor(() => {
      expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    })
  })
})
