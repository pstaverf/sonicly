import { buildQuery, requestJson } from './client'
import type { QueryParams } from './client'

export const AUDIUS_BASE_URL = 'https://api.audius.co/v1'

export const audiusAppName = import.meta.env.VITE_AUDIUS_APP_NAME ?? 'Sonicly'

export interface AudiusArtwork {
  '150x150'?: string
  '480x480'?: string
  '1000x1000'?: string
  '2000x'?: string
}

export interface AudiusUser {
  id: string
  user_id: number
  handle: string
  name: string
  bio: string | null
  website: string | null
  follower_count: number
  track_count: number
  cover_photo?: AudiusArtwork
  profile_picture?: AudiusArtwork
}

export interface AudiusTrack {
  id: string
  track_id: number
  title: string
  slug: string
  duration: number
  play_count: number
  favorite_count: number
  repost_count: number
  genre: string
  mood: string | null
  tags: string | null
  release_date: string
  is_streamable: boolean
  permalink: string
  artwork?: AudiusArtwork
  stream?: { url: string }
  user?: AudiusUser
  album_backlink?: {
    playlist_id: number
    playlist_name: string
    permalink: string
  } | null
}

export interface AudiusPlaylist {
  id: string
  playlist_id: number
  playlist_name: string
  slug: string
  is_album: boolean
  total_play_count: number
  favorite_count: number
  release_date?: string
  created_at?: string
  artwork?: AudiusArtwork
  user?: AudiusUser
  tracks?: AudiusTrack[]
}

export interface AudiusResponse<T> {
  data: T[]
}

export interface AudiusItemResponse<T> {
  data: T
}

const fetchAudius = async <T>(
  path: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<AudiusResponse<T>> => {
  const query = buildQuery({ app_name: audiusAppName, ...params })

  return requestJson<AudiusResponse<T>>(
    `${AUDIUS_BASE_URL}${path}?${query}`,
    'audius',
    signal,
  )
}

const fetchAudiusItem = async <T>(
  path: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<AudiusItemResponse<T>> => {
  const query = buildQuery({ app_name: audiusAppName, ...params })

  return requestJson<AudiusItemResponse<T>>(
    `${AUDIUS_BASE_URL}${path}?${query}`,
    'audius',
    signal,
  )
}

export const audiusTrendingTracks = (params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusTrack>('/tracks/trending', params, signal)

export const audiusSearchTracks = (query: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusTrack>('/tracks/search', { ...params, query }, signal)

export const audiusSearchUsers = (query: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusUser>('/users/search', { ...params, query }, signal)

export const audiusTrendingPlaylists = (params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusPlaylist>('/playlists/trending', params, signal)

export const audiusUserTracks = (handle: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusTrack>(`/users/${handle}/tracks`, params, signal)

export const audiusTrackById = (id: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudiusItem<AudiusTrack>(`/tracks/${id}`, params, signal)

export const audiusPlaylistTracks = (playlistId: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusPlaylist>(`/playlists/${playlistId}`, params, signal)

export const audiusPlaylistById = (playlistId: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusPlaylist>(`/playlists/${playlistId}`, params, signal)

export const audiusUserById = (handle: string, params: QueryParams, signal?: AbortSignal) =>
  fetchAudiusItem<AudiusUser>(`/users/${handle}`, params, signal)

export const audiusAlbums = (params: QueryParams, signal?: AbortSignal) =>
  fetchAudius<AudiusPlaylist>('/playlists/albums', params, signal)
