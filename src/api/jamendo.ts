import { buildQuery, requestJson } from './client'
import type { QueryParams } from './client'

export const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0'

export const jamendoClientId = import.meta.env.VITE_JAMENDO_CLIENT_ID ?? ''

export interface JamendoHeaders {
  status: string
  code: number
  error_message: string
  warnings: string
  results_count: number
  next?: string
}

export interface JamendoTrack {
  id: string
  name: string
  duration: number
  artist_id: string
  artist_name: string
  artist_idstr: string
  album_name: string
  album_id: string
  license_ccurl: string
  position: number
  releasedate: string
  album_image: string
  audio: string
  audiodownload: string
  shorturl: string
  shareurl: string
  image: string
  musicinfo?: {
    vocalinstrumental?: string
    gender?: string
    speed?: string
    tags?: {
      genres?: string[]
      instruments?: string[]
      vartags?: string[]
    }
  }
  licenses?: {
    cc?: string
    ccnc?: string
    ccnd?: string
    ccsa?: string
  }
}

export interface JamendoAlbum {
  id: string
  name: string
  releasedate: string
  artist_id: string
  artist_name: string
  image: string
  zip: string
  shorturl: string
  shareurl: string
}

export interface JamendoArtist {
  id: string
  name: string
  website: string
  joindate: string
  image: string
  shorturl: string
  shareurl: string
}

export interface JamendoPlaylist {
  id: string
  name: string
  creationdate: string
  user_id: string
  user_name: string
  zip: string
  shorturl: string
  shareurl: string
  tracks?: JamendoPlaylistTrack[]
}

export interface JamendoPlaylistTrack {
  id: string
  name: string
  album_id: string
  artist_id: string
  artist_name: string
  duration: string
  position: string
  license_ccurl: string
  album_image: string
  image: string
  audio: string
}

export interface JamendoResponse<T> {
  headers: JamendoHeaders
  results: T[]
}

const fetchJamendo = async <T>(
  path: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<JamendoResponse<T>> => {
  const query = buildQuery({
    client_id: jamendoClientId,
    format: 'json',
    ...params,
  })

  const payload = await requestJson<JamendoResponse<T>>(
    `${JAMENDO_BASE_URL}${path}?${query}`,
    'jamendo',
    signal,
  )

  return payload
}

export const jamendoTracks = (params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoTrack>('/tracks', params, signal)

export const jamendoAlbums = (params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoAlbum>('/albums', params, signal)

export const jamendoArtists = (params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoArtist>('/artists', params, signal)

export const jamendoPlaylists = (params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoPlaylist>('/playlists', params, signal)

export const jamendoPlaylistTracks = (params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoPlaylist>('/playlists/tracks', {
    audioformat: 'mp32',
    imagesize: 600,
    track_type: 'single albumtrack',
    ...params,
  }, signal)

export const jamendoArtistTracks = (artistId: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoTrack>(
    '/tracks',
    { ...params, artist_id: artistId, type: 'single albumtrack' },
    signal,
  )

export const jamendoAlbumTracks = (albumId: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoTrack>(
    '/tracks',
    { ...params, album_id: albumId, type: 'single albumtrack' },
    signal,
  )

export const jamendoTrackById = (id: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoTrack>('/tracks', { ...params, id }, signal)

export const jamendoArtistById = (id: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoArtist>('/artists', { ...params, id }, signal)

export const jamendoAlbumById = (id: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoAlbum>('/albums', { ...params, id }, signal)

export const jamendoPlaylistById = (id: string, params: QueryParams, signal?: AbortSignal) =>
  fetchJamendo<JamendoPlaylist>('/playlists', { ...params, id }, signal)

export const jamendoHasClientId = () => jamendoClientId.length > 0
