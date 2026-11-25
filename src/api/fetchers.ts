import type { Album, Artist, Page, Playlist, SearchResults, Track } from '../types'
import { parseSlug } from '../lib/slug'

import type { QueryParams } from './client'
import { adaptAudiusAlbum, adaptAudiusArtist, adaptAudiusPlaylist, adaptAudiusTrack } from './adapters/audius'
import { adaptJamendoAlbum, adaptJamendoArtist, adaptJamendoPlaylist, adaptJamendoTrack } from './adapters/jamendo'
import {
  audiusPlaylistTracks,
  audiusSearchTracks,
  audiusSearchUsers,
  audiusTrackById,
  audiusTrendingPlaylists,
  audiusTrendingTracks,
  audiusUserTracks,
} from './audius'
import {
  jamendoAlbumById,
  jamendoAlbumTracks,
  jamendoAlbums,
  jamendoArtistById,
  jamendoArtistTracks,
  jamendoArtists,
  jamendoPlaylistById,
  jamendoPlaylistTracks,
  jamendoPlaylists,
  jamendoTrackById,
  jamendoTracks,
} from './jamendo'

export const PAGE_SIZE = 24

export const TRACK_PARAMS: QueryParams = {
  include: ['musicinfo', 'licenses'],
  audioformat: 'mp32',
  imagesize: 600,
  type: 'single albumtrack',
}

export interface TrackQuery {
  tags?: string
  search?: string
  order?: string
  albumId?: string
  artistId?: string
  genre?: string
}

const isPlayable = (track: Track): boolean => track.streamUrl.length > 0

export const dropUnplayable = (tracks: Track[]): Track[] => tracks.filter(isPlayable)

export const settle = async <T extends readonly unknown[]>(
  promises: { [K in keyof T]: Promise<T[K]> },
): Promise<{ [K in keyof T]: T[K] | undefined }> => {
  const results = await Promise.allSettled(promises)
  const values = [] as { [K in keyof T]: T[K] | undefined }

  results.forEach((result, index) => {
    const bucket = values as unknown as Record<number, unknown>
    bucket[index] = result.status === 'fulfilled' ? result.value : undefined
  })

  return values
}

export const merge = <T,>(groups: readonly (readonly T[] | undefined)[]): T[] =>
  groups.flatMap((group) => group ?? [])

export const toPage = <T>(items: T[], offset: number, limit: number, hasMore: boolean): Page<T> => ({
  items,
  offset,
  limit,
  hasMore,
})

export const fetchJamendoTracks = async (
  query: TrackQuery,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<Track[]> => {
  const response = await jamendoTracks(
    {
      ...TRACK_PARAMS,
      tags: query.tags,
      search: query.search,
      order: query.order,
      album_id: query.albumId,
      artist_id: query.artistId,
      limit,
      offset,
    },
    signal,
  )

  return dropUnplayable(response.results.map(adaptJamendoTrack))
}

export const fetchAudiusTracks = async (
  query: TrackQuery,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<Track[]> => {
  const response = query.search
    ? await audiusSearchTracks(query.search, { limit, offset }, signal)
    : await audiusTrendingTracks({ limit, offset }, signal)

  return dropUnplayable(response.data.map(adaptAudiusTrack))
}

export const fetchNewReleases = async (signal?: AbortSignal): Promise<Track[]> => {
  const groups = await settle([
    fetchJamendoTracks({ order: 'releasedate_desc' }, 0, 12, signal),
    fetchAudiusTracks({}, 0, 12, signal),
  ])

  const tracks = merge([groups[0], groups[1]])
  if (tracks.length === 0) throw new Error('No tracks available')
  return tracks
}

export const fetchPopular = async (signal?: AbortSignal): Promise<Track[]> => {
  const groups = await settle([
    fetchJamendoTracks({ order: 'popularity_week' }, 0, 12, signal),
    fetchAudiusTracks({}, 0, 12, signal),
  ])

  const tracks = merge([groups[0], groups[1]])
  if (tracks.length === 0) throw new Error('No tracks available')
  return tracks
}

export const fetchChart = async (signal?: AbortSignal): Promise<Track[]> => {
  const response = await jamendoTracks(
    {
      ...TRACK_PARAMS,
      order: 'popularity_total',
      groupby: 'artist_id',
      limit: 10,
    },
    signal,
  )

  const tracks = dropUnplayable(response.results.map(adaptJamendoTrack))
  if (tracks.length === 0) throw new Error('No chart available')
  return tracks
}

export const fetchPlaylistsOfDay = async (signal?: AbortSignal): Promise<Playlist[]> => {
  const groups = await settle([
    jamendoPlaylists({ limit: 12 }, signal).then((response) =>
      response.results.map(adaptJamendoPlaylist),
    ),
    audiusTrendingPlaylists({ limit: 12 }, signal).then((response) =>
      response.data.map(adaptAudiusPlaylist),
    ),
  ])

  const playlists = merge([groups[0], groups[1]])
  if (playlists.length === 0) throw new Error('No playlists available')
  return playlists
}

export const fetchAlbums = async (signal?: AbortSignal): Promise<Album[]> => {
  const response = await jamendoAlbums({ limit: 12, order: 'releasedate_desc' }, signal)
  return response.results.map(adaptJamendoAlbum)
}

export const fetchArtists = async (signal?: AbortSignal): Promise<Artist[]> => {
  const response = await jamendoArtists({ limit: 12, order: 'name' }, signal)
  return response.results.map(adaptJamendoArtist)
}

export const fetchSearch = async (term: string, signal?: AbortSignal): Promise<SearchResults> => {
  const groups = await settle([
    fetchJamendoTracks({ search: term }, 0, 20, signal),
    fetchAudiusTracks({ search: term }, 0, 20, signal),
    jamendoAlbums({ limit: 12, namesearch: term }, signal).then((response) =>
      response.results.map(adaptJamendoAlbum),
    ),
    jamendoArtists({ limit: 12, namesearch: term }, signal).then((response) =>
      response.results.map(adaptJamendoArtist),
    ),
    audiusSearchUsers(term, { limit: 12 }, signal).then((response) =>
      response.data.map(adaptAudiusArtist),
    ),
    jamendoPlaylists({ limit: 12, namesearch: term }, signal).then((response) =>
      response.results.map(adaptJamendoPlaylist),
    ),
    audiusTrendingPlaylists({ limit: 12 }, signal).then((response) =>
      response.data.map(adaptAudiusPlaylist),
    ),
  ])

  const tracks = merge([groups[0], groups[1]])
  const albums = groups[2] ?? []
  const artists = merge([groups[3], groups[4]])
  const playlists = merge([groups[5], groups[6]])

  if (tracks.length + albums.length + artists.length + playlists.length === 0) {
    throw new Error('No results')
  }

  return { tracks, albums, artists, playlists }
}

export const fetchAlbum = async (
  slug: string,
  signal?: AbortSignal,
): Promise<{ album: Album; tracks: Track[] }> => {
  const parsed = parseSlug(slug)

  if (parsed.source === 'audius') {
    const response = await audiusPlaylistTracks(parsed.id, {}, signal)
    const raw = response.data[0]
    if (!raw) throw new Error('Album not found')

    const tracks = dropUnplayable((raw.tracks ?? []).map(adaptAudiusTrack))
    const album = adaptAudiusAlbum(raw)
    return { album: { ...album, trackCount: tracks.length }, tracks }
  }

  if (parsed.source === 'jamendo') {
    const groups = await settle([
      jamendoAlbumById(parsed.id, {}, signal).then((response) => response.results[0]),
      jamendoAlbumTracks(parsed.id, { ...TRACK_PARAMS, limit: 100 }, signal).then((response) =>
        dropUnplayable(response.results.map(adaptJamendoTrack)),
      ),
    ])

    const rawAlbum = groups[0]
    const tracks = groups[1] ?? []
    if (!rawAlbum) throw new Error('Album not found')

    const album = adaptJamendoAlbum(rawAlbum)
    return { album: { ...album, trackCount: tracks.length }, tracks }
  }

  throw new Error('Unsupported source')
}

export const fetchPlaylist = async (
  slug: string,
  signal?: AbortSignal,
): Promise<{ playlist: Playlist; tracks: Track[] }> => {
  const parsed = parseSlug(slug)

  if (parsed.source === 'audius') {
    const response = await audiusPlaylistTracks(parsed.id, {}, signal)
    const raw = response.data[0]
    if (!raw) throw new Error('Playlist not found')

    const tracks = dropUnplayable((raw.tracks ?? []).map(adaptAudiusTrack))
    const playlist = adaptAudiusPlaylist(raw)
    return { playlist: { ...playlist, trackCount: tracks.length }, tracks }
  }

  if (parsed.source === 'jamendo') {
    const groups = await settle([
      jamendoPlaylistById(parsed.id, {}, signal).then((response) => response.results[0]),
      jamendoPlaylistTracks({ id: parsed.id, ...TRACK_PARAMS, limit: 100 }, signal).then(
        (response) => dropUnplayable(response.results[0]?.tracks?.map(adaptJamendoTrack) ?? []),
      ),
    ])

    const rawPlaylist = groups[0]
    const tracks = groups[1] ?? []
    if (!rawPlaylist) throw new Error('Playlist not found')

    const playlist = adaptJamendoPlaylist(rawPlaylist)
    return { playlist: { ...playlist, trackCount: tracks.length }, tracks }
  }

  throw new Error('Unsupported source')
}

export const fetchArtist = async (
  slug: string,
  signal?: AbortSignal,
): Promise<{ artist: Artist; tracks: Track[] }> => {
  const parsed = parseSlug(slug)

  if (parsed.source === 'audius') {
    const response = await audiusUserTracks(parsed.id, { limit: 50 }, signal)
    const tracks = dropUnplayable(response.data.map(adaptAudiusTrack))
    if (tracks.length === 0) throw new Error('Artist not found')

    const first = tracks[0]
    return {
      artist: {
        id: `audius:${parsed.id}`,
        source: 'audius',
        slug: first.artistSlug,
        name: first.artistName,
        imageUrl: '',
        bio: null,
        website: null,
        followers: 0,
        trackCount: tracks.length,
      },
      tracks,
    }
  }

  if (parsed.source === 'jamendo') {
    const groups = await settle([
      jamendoArtistById(parsed.id, {}, signal).then((response) => response.results[0]),
      jamendoArtistTracks(parsed.id, { ...TRACK_PARAMS, limit: 50 }, signal).then((response) =>
        dropUnplayable(response.results.map(adaptJamendoTrack)),
      ),
    ])

    const rawArtist = groups[0]
    const tracks = groups[1] ?? []
    if (!rawArtist) throw new Error('Artist not found')

    return { artist: adaptJamendoArtist(rawArtist), tracks }
  }

  throw new Error('Unsupported source')
}

export const fetchTrack = async (slug: string, signal?: AbortSignal): Promise<Track> => {
  const parsed = parseSlug(slug)

  if (parsed.source === 'audius') {
    const response = await audiusTrackById(parsed.id, {}, signal)
    const track = response.data[0]
    if (!track) throw new Error('Track not found')
    return adaptAudiusTrack(track)
  }

  if (parsed.source === 'jamendo') {
    const response = await jamendoTrackById(parsed.id, { ...TRACK_PARAMS, limit: 1 }, signal)
    const track = response.results[0]
    if (!track) throw new Error('Track not found')
    return adaptJamendoTrack(track)
  }

  throw new Error('Unsupported source')
}

export const fetchGenrePage = async (
  tag: string,
  offset: number,
  signal?: AbortSignal,
): Promise<Page<Track>> => {
  const items = await fetchJamendoTracks({ tags: tag, order: 'popularity_week' }, offset, PAGE_SIZE, signal)
  return toPage(items, offset, PAGE_SIZE, items.length >= PAGE_SIZE)
}
