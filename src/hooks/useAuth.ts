import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import type { LocalPlaylist, Track, User } from '../types'
import { useStore } from '../store'
import {
  addRemoteLike,
  deleteRemotePlaylist,
  fetchRemoteLikes,
  fetchRemotePlaylists,
  isSupabaseConfigured,
  removeRemoteLike,
  supabase,
  upsertRemotePlaylist,
} from '../lib/supabase'

const toUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email ?? null,
  name:
    session.user.user_metadata?.full_name ??
    session.user.user_metadata?.name ??
    (session.user.email ? session.user.email.split('@')[0] : 'Sonicly'),
  avatarUrl: session.user.user_metadata?.avatar_url ?? '',
  isGuest: false,
})

/**
 * Keeps the store in step with the session of Supabase. It has to live in the
 * shell and not on the login page, otherwise a visitor who opens the app with
 * an existing session stays a guest.
 */
export const useSessionListener = (): void => {
  const login = useStore((state) => state.login)
  const logout = useStore((state) => state.logout)

  useEffect(() => {
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        logout()
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        login(toUser(session))
      }
    })

    return () => data.subscription.unsubscribe()
  }, [login, logout])
}

export interface AuthApi {
  configured: boolean
  pending: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

/**
 * The guest library and the account library become one list. The function
 * reads the current state from the store instead of the render scope, so it
 * stays stable and the sync effect cannot loop.
 */
let mergedFor = ''

/**
 * Forgets that the library of an account was merged, so the next sign in
 * hands the guest library over again.
 */
export const resetAccountMerge = (): void => {
  mergedFor = ''
}

export const mergeAccountLibrary = async (userId: string): Promise<void> => {
  if (!supabase) return
  if (mergedFor === userId) return

  mergedFor = userId

  const state = useStore.getState()
  const guestLikes = state.likedTracks
  const guestPlaylists = state.playlists

  const [remoteLikes, remotePlaylists] = await Promise.all([
    fetchRemoteLikes(userId),
    fetchRemotePlaylists(userId),
  ])

  for (const track of guestLikes) {
    if (!remoteLikes.some((like) => like.trackId === track.id)) {
      await addRemoteLike(userId, track.id, track)
    }
  }

  for (const playlist of guestPlaylists) {
    await upsertRemotePlaylist(userId, {
      id: playlist.id,
      title: playlist.title,
      trackIds: playlist.trackIds,
      createdAt: playlist.createdAt,
    })
  }

  const likes = new Map<string, Track>()
  for (const like of remoteLikes) {
    if (like.track) likes.set(like.trackId, like.track)
  }
  for (const track of guestLikes) likes.set(track.id, track)

  const playlistMap = new Map<string, LocalPlaylist>()
  for (const playlist of remotePlaylists) {
    playlistMap.set(playlist.id, {
      id: playlist.id,
      title: playlist.title,
      trackIds: playlist.trackIds,
      createdAt: playlist.createdAt,
    })
  }
  for (const playlist of guestPlaylists) playlistMap.set(playlist.id, playlist)

  const current = useStore.getState()
  if (current.user.id !== userId || current.user.isGuest) return

  current.setLikedTracks([...likes.values()])
  current.setPlaylists([...playlistMap.values()])
}

export const useAuth = (): AuthApi => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useStore((state) => state.login)
  const logout = useStore((state) => state.logout)

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!supabase) {
        setError('Supabase is not configured')
        return false
      }

      setPending(true)
      setError(null)

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setPending(false)
        setError(signInError.message)
        return false
      }

      const session = data.session
      if (session) {
        login(toUser(session))
        await mergeAccountLibrary(session.user.id)
      }

      setPending(false)
      return true
    },
    [login],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!supabase) {
        setError('Supabase is not configured')
        return false
      }

      setPending(true)
      setError(null)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: email.split('@')[0] },
        },
      })

      if (signUpError) {
        setPending(false)
        setError(signUpError.message)
        return false
      }

      const session = data.session
      if (session) {
        login(toUser(session))
        await mergeAccountLibrary(session.user.id)
      }

      setPending(false)
      return true
    },
    [login],
  )

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      setError('Supabase is not configured')
      return false
    }

    setPending(true)
    setError(null)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

    if (oauthError) {
      setPending(false)
      setError(oauthError.message)
      return false
    }

    setPending(false)
    return true
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return

    await supabase.auth.signOut()
    resetAccountMerge()
    logout()
  }, [logout])

  const clearError = useCallback(() => setError(null), [])

  return {
    configured: isSupabaseConfigured,
    pending,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
  }
}

/**
 * Pulls the library of the account into the local one and hands the guest
 * library over to the account. It lives in the shell, so a visitor who opens
 * the app with an existing session sees the library right away.
 */
export const useAccountSync = (): void => {
  const userId = useStore((state) => state.user.id)
  const isGuest = useStore((state) => state.user.isGuest)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (isGuest) return

    const sync = async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      await mergeAccountLibrary(data.session.user.id)
    }

    void sync()
  }, [userId, isGuest])
}

/**
 * Pushes the local library to the account. The diff is kept in a ref, so only
 * the tracks and the playlists that really changed travel to the server.
 */
export const useLibrarySync = (): void => {
  const user = useStore((state) => state.user)
  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)

  const syncedLikes = useRef<Set<string>>(new Set())
  const syncedPlaylists = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!supabase) return
    if (user.isGuest) return

    const userId = user.id
    const likes = new Set(likedTracks.map((track) => track.id))

    for (const track of likedTracks) {
      if (syncedLikes.current.has(track.id)) continue
      void addRemoteLike(userId, track.id, track)
    }

    for (const trackId of syncedLikes.current) {
      if (!likes.has(trackId)) void removeRemoteLike(userId, trackId)
    }

    syncedLikes.current = likes

    const current = new Map(playlists.map((playlist) => [playlist.id, playlist.trackIds.join(',')]))

    for (const playlist of playlists) {
      if (syncedPlaylists.current.get(playlist.id) === playlist.trackIds.join(',')) continue
      void upsertRemotePlaylist(userId, {
        id: playlist.id,
        title: playlist.title,
        trackIds: playlist.trackIds,
        createdAt: playlist.createdAt,
      })
    }

    for (const playlistId of syncedPlaylists.current.keys()) {
      if (!current.has(playlistId)) void deleteRemotePlaylist(userId, playlistId)
    }

    syncedPlaylists.current = current
  }, [user.id, user.isGuest, likedTracks, playlists])
}
