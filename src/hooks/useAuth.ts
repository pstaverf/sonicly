import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import type { User } from '../types'
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

export const useAuth = (): AuthApi => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useStore((state) => state.login)
  const logout = useStore((state) => state.logout)
  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)
  const setLikedTracks = useStore((state) => state.setLikedTracks)
  const setPlaylists = useStore((state) => state.setPlaylists)

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

  const mergeGuestData = useCallback(
    async (userId: string) => {
      if (!supabase) return

      const [remoteLikes, remotePlaylists] = await Promise.all([
        fetchRemoteLikes(userId),
        fetchRemotePlaylists(userId),
      ])

      for (const track of likedTracks) {
        if (!remoteLikes.includes(track.id)) {
          await addRemoteLike(userId, track.id)
        }
      }

      for (const playlist of playlists) {
        await upsertRemotePlaylist(userId, {
          id: playlist.id,
          title: playlist.title,
          trackIds: playlist.trackIds,
          createdAt: playlist.createdAt,
        })
      }

      const merged = new Map<string, string>()
      for (const id of remoteLikes) merged.set(id, id)
      for (const track of likedTracks) merged.set(track.id, track.id)

      const playlistMap = new Map<string, (typeof playlists)[number]>()
      for (const playlist of remotePlaylists) {
        playlistMap.set(playlist.id, {
          id: playlist.id,
          title: playlist.title,
          trackIds: playlist.trackIds,
          createdAt: playlist.createdAt,
        })
      }
      for (const playlist of playlists) playlistMap.set(playlist.id, playlist)

      setLikedTracks(likedTracks.filter((track) => merged.has(track.id)))
      setPlaylists([...playlistMap.values()])
    },
    [likedTracks, playlists, setLikedTracks, setPlaylists],
  )

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
        await mergeGuestData(session.user.id)
      }

      setPending(false)
      return true
    },
    [login, mergeGuestData],
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
        await mergeGuestData(session.user.id)
      }

      setPending(false)
      return true
    },
    [login, mergeGuestData],
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
    logout()
  }, [logout])

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const sync = async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      await mergeGuestData(data.session.user.id)
    }

    void sync()
  }, [mergeGuestData])

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

export const useSyncLibrary = () => {
  const user = useStore((state) => state.user)
  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)
  const toggleLike = useStore((state) => state.toggleLike)
  const createPlaylist = useStore((state) => state.createPlaylist)
  const deletePlaylist = useStore((state) => state.deletePlaylist)

  const syncLike = useCallback(
    async (trackId: string, liked: boolean) => {
      if (user.isGuest) return
      if (liked) await addRemoteLike(user.id, trackId)
      else await removeRemoteLike(user.id, trackId)
    },
    [user.id, user.isGuest],
  )

  const syncPlaylistDelete = useCallback(
    async (playlistId: string) => {
      if (user.isGuest) return
      await deleteRemotePlaylist(user.id, playlistId)
    },
    [user.id, user.isGuest],
  )

  return { syncLike, syncPlaylistDelete, likedTracks, playlists, toggleLike, createPlaylist, deletePlaylist }
}
