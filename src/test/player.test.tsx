import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
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

const track = {
  id: 'jamendo:1',
  source: 'jamendo',
  slug: 'first-jamendo-1',
  title: 'First Track',
  artistId: 'jamendo:9',
  artistName: 'Artist',
  artistSlug: 'artist-jamendo-9',
  albumId: null,
  albumTitle: null,
  albumSlug: null,
  coverUrl: 'https://img.test/1.jpg',
  streamUrl: 'https://stream.test/1.mp3',
  duration: 120,
  releaseDate: '2024-01-01',
  genres: ['rock'],
  licenseUrl: null,
  licenseLabel: 'CC BY',
  plays: 0,
  likes: 0,
  mood: null,
  shareUrl: 'https://www.jamendo.com/track/1',
}

const emptyResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ headers: {}, results: [], data: [] }),
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

describe('player wiring', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => emptyResponse()))
    useStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      repeat: 'off',
      likedTracks: [],
      history: [],
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the current track and plays it when the state says so', async () => {
    useStore.setState({
      currentTrack: track as never,
      queue: [track as never],
      queueIndex: 0,
      isPlaying: true,
    })

    renderApp()

    await waitFor(() => {
      expect(player.loadTrack).toHaveBeenCalled()
    })

    expect(player.play).toHaveBeenCalled()
    expect(player.setupMediaSession).toHaveBeenCalled()
  })

  it('replays the track when it ends and repeat is one', async () => {
    useStore.setState({
      currentTrack: track as never,
      queue: [track as never],
      queueIndex: 0,
      isPlaying: true,
      repeat: 'one',
    })

    renderApp()

    await waitFor(() => {
      expect(player.loadTrack).toHaveBeenCalled()
    })

    const handlers = player.loadTrack.mock.calls.at(-1)?.[1] as {
      onEnd: () => void
    }

    player.seek.mockClear()
    player.play.mockClear()

    handlers.onEnd()

    expect(player.seek).toHaveBeenCalledWith(0)
    expect(player.play).toHaveBeenCalled()
  })

  it('moves to the next track when it ends and repeat is off', async () => {
    useStore.setState({
      currentTrack: track as never,
      queue: [track as never],
      queueIndex: 0,
      isPlaying: true,
      repeat: 'off',
    })

    renderApp()

    await waitFor(() => {
      expect(player.loadTrack).toHaveBeenCalled()
    })

    const handlers = player.loadTrack.mock.calls.at(-1)?.[1] as {
      onEnd: () => void
    }

    player.seek.mockClear()
    player.play.mockClear()

    handlers.onEnd()

    expect(player.seek).not.toHaveBeenCalled()
    expect(useStore.getState().isPlaying).toBe(false)
  })
})
