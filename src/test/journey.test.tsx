import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { useStore } from '../store'

const player = vi.hoisted(() => ({
  loadTrack: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  unload: vi.fn(),
  seek: vi.fn(),
  getCurrentTime: vi.fn(() => 0),
  getDuration: vi.fn(() => 0),
  setVolume: vi.fn(),
  isLoaded: vi.fn(() => true),
  preloadTrack: vi.fn(),
  getCurrentTrackId: vi.fn(() => ''),
  setupMediaSession: vi.fn(),
}))

vi.mock('../lib/player', () => player)

const jamendoTrack = {
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

const audiusTrack = {
  id: 'audius1',
  track_id: 998877,
  title: 'Audius Track',
  duration: 180,
  play_count: 4200,
  favorite_count: 120,
  genre: 'Electronic',
  mood: 'Energizing',
  tags: 'edm,house',
  release_date: '2026-03-01T00:00:00Z',
  permalink: '/artist/audius-track',
  artwork: { '1000x1000': 'https://cdn.test/art.jpg' },
  stream: { url: 'https://cdn.test/stream.mp3' },
  user: { id: 'B0gPY79', name: 'Audius Artist' },
}

const headers = { results_count: 1 }

const respond = (url: string) => {
  const target = new URL(url)

  if (target.hostname.includes('audius')) {
    if (target.pathname.endsWith('/tracks/trending')) return { data: [audiusTrack] }
    return { data: [] }
  }

  const path = target.pathname
  const isSearch = target.searchParams.has('search') || target.searchParams.has('namesearch')

  if (path.endsWith('/playlists/tracks')) {
    return { headers, results: [{ id: '11696', name: 'Test Playlist', user_name: 'Curator', tracks: [jamendoTrack] }] }
  }

  if (path.endsWith('/playlists')) {
    return { headers, results: [{ id: '11696', name: 'Test Playlist', user_name: 'Curator', shareurl: 'https://www.jamendo.com/list/p11696' }] }
  }

  if (path.endsWith('/albums')) {
    return {
      headers,
      results: [
        {
          id: '145774',
          name: 'Test Album',
          artist_id: '42',
          artist_name: 'Test Artist',
          releasedate: '2024-01-15',
          image: 'https://prod-1.storage.jamendo.com/?albumid=145774',
          shareurl: 'https://www.jamendo.com/album/145774',
        },
      ],
    }
  }

  if (path.endsWith('/artists')) {
    return {
      headers,
      results: [
        {
          id: '42',
          name: 'Test Artist',
          website: 'https://artist.test',
          joindate: '2020-01-01',
          image: 'https://prod-1.storage.jamendo.com/?artistid=42',
          shareurl: 'https://www.jamendo.com/artist/42',
        },
      ],
    }
  }

  if (path.endsWith('/tracks')) {
    if (isSearch) return { headers, results: [jamendoTrack] }
    return { headers, results: [jamendoTrack] }
  }

  return { headers, results: [] }
}

const locations: string[] = []

const LocationWatcher = () => {
  const location = useLocation()

  useEffect(() => {
    locations.push(`${location.pathname}${location.search}`)
  }, [location.pathname, location.search])

  return null
}

const renderApp = (route = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  locations.length = 0

  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={[route]}>
          <LocationWatcher />
          <App />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  )
}

describe('the journey of a listener', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => respond(String(url)),
      })),
    )

    useStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      likedTracks: [],
      playlists: [],
      history: [],
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts a track from the home page and keeps it in the player', async () => {
    renderApp('/')

    const play = await screen.findAllByRole('button', { name: 'Воспроизвести' }, { timeout: 5000 })
    expect(play.length).toBeGreaterThan(0)

    fireEvent.click(play[0])

    await waitFor(() => {
      expect(useStore.getState().currentTrack?.id).toBe('jamendo:123456')
    })

    expect(useStore.getState().isPlaying).toBe(true)
    expect(player.loadTrack).toHaveBeenCalled()
    expect(player.play).toHaveBeenCalled()
  })

  it('keeps the liked track in the library', async () => {
    renderApp('/')

    const play = await screen.findAllByRole('button', { name: 'Воспроизвести' }, { timeout: 5000 })
    fireEvent.click(play[0])

    const like = await screen.findByRole('button', { name: 'Нравится' }, { timeout: 5000 })
    fireEvent.click(like)

    await waitFor(() => {
      expect(useStore.getState().likedTracks).toHaveLength(1)
    })

    expect(useStore.getState().likedTracks[0].id).toBe('jamendo:123456')
  })

  it('finds a track by the search', async () => {
    renderApp('/search')

    const input = await screen.findByRole('searchbox', undefined, { timeout: 5000 })
    fireEvent.change(input, { target: { value: 'love' } })

    expect(await screen.findAllByText('Jamendo Track', undefined, { timeout: 5000 })).not.toHaveLength(0)
  })

  it('keeps the word of the search in the address', async () => {
    renderApp('/search')

    const input = await screen.findByRole('searchbox', undefined, { timeout: 5000 })
    fireEvent.change(input, { target: { value: 'love' } })

    await waitFor(() => {
      expect(locations.at(-1)).toContain('q=love')
    })
  })

  it('starts the search with the word of the address', async () => {
    renderApp('/search?q=love')

    const input = await screen.findByRole('searchbox', undefined, { timeout: 5000 })
    expect(input).toHaveValue('love')

    expect(await screen.findAllByText('Jamendo Track', undefined, { timeout: 5000 })).not.toHaveLength(0)
  })

  it('creates a playlist and puts a track into it', async () => {
    renderApp('/library')

    const tab = await screen.findByRole('tab', { name: 'Плейлисты' }, { timeout: 5000 })
    fireEvent.click(tab)

    const create = await screen.findByRole('button', { name: /Создать плейлист/i }, { timeout: 5000 })
    fireEvent.click(create)

    const input = await screen.findByLabelText('Название плейлиста')
    fireEvent.change(input, { target: { value: 'Мой микс' } })

    const confirm = screen.getByRole('button', { name: 'Создать' })
    fireEvent.click(confirm)

    await waitFor(() => {
      expect(useStore.getState().playlists).toHaveLength(1)
    })

    expect(useStore.getState().playlists[0].title).toBe('Мой микс')
  })

  it('opens the tab of the library that the address names', async () => {
    renderApp('/library?tab=history')

    const history = await screen.findByRole('tab', { name: 'История' }, { timeout: 5000 })
    expect(history).toHaveAttribute('aria-selected', 'true')
  })

  it('marks only the open tab of the library in the navigation', async () => {
    renderApp('/library?tab=wave')

    // the sidebar stands before the navigation of the phone in the page
    const wave = (await screen.findAllByRole('link', { name: /Моя волна|My Wave/i }))[0]
    const library = (await screen.findAllByRole('link', { name: /Моя коллекция|My Collection/i }))[0]

    await waitFor(() => {
      expect(wave.className).toContain('text-accent')
    })

    expect(library.className).not.toContain('text-accent')
  })

  it('clears the history of the listener', async () => {
    useStore.setState({ history: [jamendoTrack as never] })

    renderApp('/library?tab=history')

    const clear = await screen.findByRole('button', { name: 'Очистить историю' }, { timeout: 5000 })
    fireEvent.click(clear)

    await waitFor(() => {
      expect(useStore.getState().history).toHaveLength(0)
    })
  })

  it('opens the album of the catalogue and shows its tracks', async () => {
    renderApp('/album/test-album-jamendo-145774')

    expect(await screen.findByRole('heading', { name: 'Test Album' }, { timeout: 5000 })).toBeInTheDocument()
    expect((await screen.findAllByText('Jamendo Track')).length).toBeGreaterThan(0)
  })

  it('does not break when the api answers with nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ headers: { results_count: 0 }, results: [], data: [] }),
      })),
    )

    renderApp('/')

    await waitFor(() => {
      expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    })

    expect(useStore.getState().currentTrack).toBeNull()
  })
})
