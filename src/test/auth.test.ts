import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Track } from '../types'
import { useStore } from '../store'
import { resetAccountMerge } from '../hooks/useAuth'

const remote = vi.hoisted(() => ({
  likes: [] as { trackId: string; track: Track | null }[],
  playlists: [] as { id: string; title: string; trackIds: string[]; createdAt: number }[],
  addedLikes: [] as { userId: string; trackId: string }[],
  removedLikes: [] as { userId: string; trackId: string }[],
  upsertedPlaylists: [] as { userId: string; id: string }[],
}))

const session = {
  user: {
    id: 'user-1',
    email: 'listener@sonicly.app',
    user_metadata: { full_name: 'Listener' },
  },
}

vi.mock('../lib/supabase', () => {
  const client = {
    auth: {
      onAuthStateChange: (callback: (event: string, value: unknown) => void) => {
        callback('INITIAL_SESSION', session)
        return { data: { subscription: { unsubscribe: () => undefined } } }
      },
      getSession: async () => ({ data: { session } }),
      signInWithPassword: async () => ({ data: { session }, error: null }),
      signUp: async () => ({ data: { session }, error: null }),
      signInWithOAuth: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
  }

  return {
    supabase: client,
    isSupabaseConfigured: true,
    fetchRemoteLikes: async () => remote.likes,
    fetchRemotePlaylists: async () => remote.playlists,
    addRemoteLike: async (userId: string, trackId: string, track: Track) => {
      remote.addedLikes.push({ userId, trackId })
      remote.likes.push({ trackId, track })
    },
    removeRemoteLike: async (userId: string, trackId: string) => {
      remote.removedLikes.push({ userId, trackId })
    },
    upsertRemotePlaylist: async (userId: string, playlist: { id: string }) => {
      remote.upsertedPlaylists.push({ userId, id: playlist.id })
    },
    deleteRemotePlaylist: async () => undefined,
  }
})

const makeTrack = (id: string): Track => ({
  id,
  source: 'jamendo',
  slug: `track-${id}`,
  title: `Track ${id}`,
  artistId: 'jamendo:1',
  artistName: 'Artist',
  artistSlug: 'artist-jamendo-1',
  albumId: null,
  albumTitle: null,
  albumSlug: null,
  coverUrl: '',
  streamUrl: 'https://stream.test/1.mp3',
  duration: 100,
  releaseDate: '2024-01-01',
  genres: [],
  licenseUrl: null,
  licenseLabel: 'CC BY',
  plays: 0,
  likes: 0,
  mood: null,
  shareUrl: '',
})

describe('account library', () => {
  beforeEach(() => {
    remote.likes = []
    remote.playlists = []
    remote.addedLikes = []
    remote.removedLikes = []
    remote.upsertedPlaylists = []

    useStore.setState({
      user: { id: 'guest', email: null, name: 'Гость', avatarUrl: '', isGuest: true },
      likedTracks: [],
      playlists: [],
      history: [],
    })

    resetAccountMerge()
  })

  afterEach(() => {
    useStore.setState({
      likedTracks: [],
      playlists: [],
      history: [],
    })
  })

  it('moves the guest library into the account and keeps the remote likes', async () => {
    const guestTrack = makeTrack('guest-1')
    const remoteTrack = makeTrack('remote-1')

    useStore.setState({
      likedTracks: [guestTrack],
      playlists: [{ id: 'local-1', title: 'Микс', trackIds: ['guest-1'], createdAt: 1 }],
    })

    remote.likes = [{ trackId: 'remote-1', track: remoteTrack }]

    const { useAuth } = await import('../hooks/useAuth')
    const { result } = renderHook(() => useAuth())

    let signedIn = false
    await act(async () => {
      signedIn = await result.current.signIn('listener@sonicly.app', 'secret')
    })

    expect(signedIn).toBe(true)
    expect(useStore.getState().user.name).toBe('Listener')

    await waitFor(() => {
      expect(useStore.getState().likedTracks.map((track) => track.id).sort()).toEqual([
        'guest-1',
        'remote-1',
      ])
    })

    expect(remote.addedLikes).toEqual([{ userId: 'user-1', trackId: 'guest-1' }])
    expect(remote.upsertedPlaylists).toEqual([{ userId: 'user-1', id: 'local-1' }])
  })

  it('restores the session for a visitor who is already signed in', async () => {
    const { useSessionListener } = await import('../hooks/useAuth')

    renderHook(() => useSessionListener())

    await waitFor(() => {
      expect(useStore.getState().user.id).toBe('user-1')
    })
  })

  it('brings the library of the account into the shell without the login page', async () => {
    const remoteTrack = makeTrack('remote-1')
    remote.likes = [{ trackId: 'remote-1', track: remoteTrack }]

    useStore.setState({
      user: { id: 'user-1', email: 'a@b.c', name: 'Listener', avatarUrl: '', isGuest: false },
    })

    const { useAccountSync } = await import('../hooks/useAuth')
    renderHook(() => useAccountSync())

    await waitFor(() => {
      expect(useStore.getState().likedTracks.map((track) => track.id)).toEqual(['remote-1'])
    })
  })

  it('does not remove the likes of the account when it signs in again', async () => {
    const track = makeTrack('kept-1')
    remote.likes = [{ trackId: 'kept-1', track: track }]

    const { useLibrarySync, mergeAccountLibrary } = await import('../hooks/useAuth')

    useStore.setState({
      user: { id: 'user-1', email: 'a@b.c', name: 'Listener', avatarUrl: '', isGuest: false },
    })

    await mergeAccountLibrary('user-1')

    renderHook(() => useLibrarySync())

    await waitFor(() => {
      expect(remote.addedLikes.length).toBeGreaterThan(0)
    })

    // the visitor signs out, the list of the account is empty for a moment
    useStore.setState({
      user: { id: 'guest', email: null, name: 'Гость', avatarUrl: '', isGuest: true },
      likedTracks: [],
    })
    resetAccountMerge()

    // and comes back
    useStore.setState({
      user: { id: 'user-1', email: 'a@b.c', name: 'Listener', avatarUrl: '', isGuest: false },
    })
    await mergeAccountLibrary('user-1')

    await waitFor(() => {
      expect(useStore.getState().likedTracks).toHaveLength(1)
    })

    expect(remote.removedLikes).toEqual([])
  })

  it('clears the account library when the user signs out', async () => {
    useStore.setState({
      user: { id: 'user-1', email: 'a@b.c', name: 'Listener', avatarUrl: '', isGuest: false },
      likedTracks: [makeTrack('one')],
      playlists: [{ id: 'local-1', title: 'Микс', trackIds: [], createdAt: 1 }],
      history: [makeTrack('one')],
    })

    const { useAuth } = await import('../hooks/useAuth')
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(useStore.getState().user.isGuest).toBe(true)
    expect(useStore.getState().likedTracks).toHaveLength(0)
    expect(useStore.getState().playlists).toHaveLength(0)
    expect(useStore.getState().history).toHaveLength(0)
  })
})
