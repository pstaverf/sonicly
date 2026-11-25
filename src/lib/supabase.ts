import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export interface RemotePlaylist {
  id: string
  title: string
  trackIds: string[]
  createdAt: number
}

export const fetchRemoteLikes = async (userId: string): Promise<string[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('likes')
    .select('track_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => String(row.track_id))
}

export const addRemoteLike = async (userId: string, trackId: string): Promise<void> => {
  if (!supabase) return

  const { error } = await supabase.from('likes').upsert({
    user_id: userId,
    track_id: trackId,
  })

  if (error) throw new Error(error.message)
}

export const removeRemoteLike = async (userId: string, trackId: string): Promise<void> => {
  if (!supabase) return

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId)

  if (error) throw new Error(error.message)
}

export const fetchRemotePlaylists = async (userId: string): Promise<RemotePlaylist[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('playlists')
    .select('id, title, track_ids, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    trackIds: Array.isArray(row.track_ids) ? (row.track_ids as string[]) : [],
    createdAt: new Date(String(row.created_at)).getTime(),
  }))
}

export const upsertRemotePlaylist = async (
  userId: string,
  playlist: RemotePlaylist,
): Promise<void> => {
  if (!supabase) return

  const { error } = await supabase.from('playlists').upsert({
    id: playlist.id,
    user_id: userId,
    title: playlist.title,
    track_ids: playlist.trackIds,
    created_at: new Date(playlist.createdAt).toISOString(),
  })

  if (error) throw new Error(error.message)
}

export const deleteRemotePlaylist = async (userId: string, playlistId: string): Promise<void> => {
  if (!supabase) return

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('user_id', userId)
    .eq('id', playlistId)

  if (error) throw new Error(error.message)
}
