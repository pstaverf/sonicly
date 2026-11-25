import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query'

import type { Album, Artist, Page, Playlist, SearchResults, Track } from '../types'
import { parseSlug } from '../lib/slug'
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

const TRACK_INCLUDES = ['musicinfo', 'licenses']
const TRACK_PARAMS = {
  include: TRACK_INCLUDES,
  audioformat: 'mp32',
  imagesize: 600,
  type: 'single albumtrack',
} as const

const isPlayable = (track: Track): boolean => track.streamUrl.length > 0

const dropUnplayable = (tracks: Track[]): Track[] => tracks.filter(isPlayable)

const settle = async <T extends readonly unknown[]>(
  promises: readonly [...{ [K in keyof T]: Promise<T[K]> }],
): Promise<{ values: { -readonly [K in keyof T]: T[K][] }; failed: number }> => {
  const results = await Promise.allSettled(promises)
  const values = [] as { -readonly [K in keyof T]: T[K][] }
  let failed = 0

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      values[index] = [result.value] as unknown as (typeof values)[number]
    } else {
      failed += 1
      values[index] = [] as unknown as (typeof values)[number]
    }
  }

  return { values, failed }
}

const toPage = <T>(items: T[], offset: number, limit: number, received: number): Page<T> => ({
  items,
  offset,
  limit,
  hasMore: received >= limit,
})

export interface TrackQuery {
  tags?: string
  search?: string
  order?: string
  albumId?: string
  artistId?: string
  genre?: string
}

const fetchJamendoTracks = async (
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

const fetchAudiusTracks = async (
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

export const useInfiniteTracks = (
  query: TrackQuery,
  options?: { source?: 'jamendo' | 'audius' | 'both' },
): UseInfiniteQueryResult<{ pages: Page<Track>[]; pageParams: number[] }> => {
  const source = options?.source ?? 'both'

  return useInfiniteQuery({
    queryKey: ['tracks', 'infinite', query, source],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      const offset = pageParam as number

      if (source === 'jamendo') {
        return fetchJamendoTracks(query, offset, PAGE_SIZE, signal).then((items) => ({
          pages: [toPage(items, offset, PAGE_SIZE, items.length)],
          pageParams: [offset],
        }))
      }

      if (source === 'audius') {
        return fetchAudiusTracks(query, offset, PAGE_SIZE, signal).then((items) => ({
          pages: [toPage(items, offset, PAGE_SIZE, items.length)],
          pageParams: [offset],
        }))
      }

      return Promise.all([
        fetchJamendoTracks(query, offset, PAGE_SIZE, signal),
        fetchAudiusTracks(query, offset, PAGE_SIZE, signal),
      ]).then(([jamendo, audius]) => ({
        pages: [toPage([...jamendo, ...audius], offset, PAGE_SIZE, jamendo.length + audius.length)],
        pageParams: [offset],
      }))
    },
    getNextPageParam: (lastPage) => {
      const page = lastPage.pages.at(-1)
      return page?.hasMore ? page.offset + PAGE_SIZE : undefined
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useNewReleases = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'new'],
    queryFn: async ({ signal }) => {
      const { values } = await settle([
        fetchJamendoTracks({ order: 'releasedate_desc' }, 0, 12, signal),
        fetchAudiusTracks({}, 0, 12, signal),
      ])

      const tracks = values.flat()
      if (tracks.length === 0) throw new Error('empty')
      return tracks
    },
    staleTime: 1000 * 60 * 10,
  })

export const usePopular = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'popular'],
    queryFn: async ({ signal }) => {
      const { values } = await settle([
        fetchJamendoTracks({ order: 'popularity_week' }, 0, 12, signal),
        fetchAudiusTracks({}, 0, 12, signal),
      ])

      const tracks = values.flat()
      if (tracks.length === 0) throw new Error('empty')
      return tracks
    },
    staleTime: 1000 * 60 * 10,
  })

export const useChart = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'chart'],
    queryFn: async ({ signal }) => {
      const response = await jamendoTracks(
        {
          ...TRACK_PARAMS,
          order: 'popularity_week',
          featured: 1,
          groupby: 'artist_id',
          limit: 10,
        },
        signal,
      )

      const tracks = dropUnplayable(response.results.map(adaptJamendoTrack))
      if (tracks.length === 0) throw new Error('empty')
      return tracks
    },
    staleTime: 1000 * 60 * 10,
  })

export const usePlaylistsOfDay = (): UseQueryResult<Playlist[]> =>
  useQuery({
    queryKey: ['home', 'playlists'],
    queryFn: async ({ signal }) => {
      const { values } = await settle([
        jamendoPlaylists({ limit: 12 }, signal).then((response) =>
          response.results.map(adaptJamendoPlaylist),
        ),
        audiusTrendingPlaylists({ limit: 12 }, signal).then((response) =>
          response.data.map(adaptAudiusPlaylist),
        ),
      ])

      const playlists = values.flat()
      if (playlists.length === 0) throw new Error('empty')
      return playlists
    },
    staleTime: 1000 * 60 * 30,
  })

export const useAlbums = (): UseQueryResult<Album[]> =>
  useQuery({
    queryKey: ['home', 'albums'],
    queryFn: async ({ signal }) => {
      const response = await jamendoAlbums({ limit: 12, order: 'releasedate_desc' }, signal)
      return response.results.map(adaptJamendoAlbum)
    },
    staleTime: 1000 * 60 * 30,
  })

export const useArtists = (): UseQueryResult<Artist[]> =>
  useQuery({
    queryKey: ['home', 'artists'],
    queryFn: async ({ signal }) => {
      const response = await jamendoArtists({ limit: 12, order: 'name' }, signal)
      return response.results.map(adaptJamendoArtist)
    },
    staleTime: 1000 * 60 * 30,
  })

export const useSearch = (query: string): UseQueryResult<SearchResults> =>
  useQuery({
    queryKey: ['search', query],
    enabled: query.trim().length > 0,
    queryFn: async ({ signal }) => {
      const term = query.trim()

      const { values } = await settle([
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

      const [trackSources, albumSources, artistSources, playlistSources] = values

      const tracks = trackSources.flat()
      const albums = albumSources.flat()
      const artists = artistSources.flat()
      const playlists = playlistSources.flat()

      if (tracks.length + albums.length + artists.length + playlists.length === 0) {
        throw new Error('empty')
      }

      return { tracks, albums, artists, playlists }
    },
    staleTime: 1000 * 60 * 2,
  })

export const useAlbum = (slug: string): UseQueryResult<{ album: Album; tracks: Track[] }> =>
  useQuery({
    queryKey: ['album', slug],
    enabled: slug.length > 0,
    queryFn: async ({ signal }) => {
      const { id } = parseSlug(slug)

      if (!id.startsWith('jamendo:')) {
        throw new Error('unsupported source')
      }

      const rawId = id.slice('jamendo:'.length)
      const { values } = await settle([
        jamendoAlbumById(rawId, {}, signal).then((response) => response.results[0]),
        jamendoAlbumTracks(rawId, { ...TRACK_PARAMS, limit: 100 }, signal).then((response) =>
          dropUnplayable(response.results.map(adaptJamendoTrack)),
        ),
      ])

      const [albumSources, trackSources] = values
      const rawAlbum = albumSources[0]
      const tracks = trackSources[0] ?? []
      if (!rawAlbum) throw new Error('not found')

      const album = adaptJamendoAlbum(rawAlbum)
      return { album: { ...album, trackCount: tracks.length }, tracks }
    },
    staleTime: 1000 * 60 * 30,
  })

export const usePlaylist = (slug: string): UseQueryResult<{ playlist: Playlist; tracks: Track[] }> =>
  useQuery({
    queryKey: ['playlist', slug],
    enabled: slug.length > 0,
    queryFn: async ({ signal }) => {
      const { id } = parseSlug(slug)

      if (id.startsWith('jamendo:')) {
        const rawId = id.slice('jamendo:'.length)
        const { values } = await settle([
          jamendoPlaylistById(rawId, {}, signal).then((response) => response.results[0]),
          jamendoPlaylistTracks({ id: rawId, ...TRACK_PARAMS, limit: 100 }, signal).then((response) =>
            dropUnplayable(response.results[0]?.tracks?.map(adaptJamendoTrack) ?? []),
          ),
        ])

        const [playlistSources, trackSources] = values
        const rawPlaylist = playlistSources[0]
        const tracks = trackSources[0] ?? []
        if (!rawPlaylist) throw new Error('not found')

        const playlist = adaptJamendoPlaylist(rawPlaylist)
        return { playlist: { ...playlist, trackCount: tracks.length }, tracks }
      }

      if (id.startsWith('audius:')) {
        const rawId = id.slice('audius:'.length)
        const response = await audiusPlaylistTracks(rawId, {}, signal)
        const rawPlaylist = response.data[0]
        if (!rawPlaylist) throw new Error('not found')

        const tracks = dropUnplayable((rawPlaylist.tracks ?? []).map(adaptAudiusTrack))
        const playlist = adaptAudiusPlaylist(rawPlaylist)

        return { playlist: { ...playlist, trackCount: tracks.length }, tracks }
      }

      throw new Error('unsupported source')
    },
    staleTime: 1000 * 60 * 30,
  })

export const useArtist = (slug: string): UseQueryResult<{ artist: Artist; tracks: Track[] }> =>
  useQuery({
    queryKey: ['artist', slug],
    enabled: slug.length > 0,
    queryFn: async ({ signal }) => {
      const { id } = parseSlug(slug)

      if (id.startsWith('jamendo:')) {
        const rawId = id.slice('jamendo:'.length)
        const { values } = await settle([
          jamendoArtistById(rawId, {}, signal).then((response) => response.results[0]),
          jamendoArtistTracks(rawId, { ...TRACK_PARAMS, limit: 50 }, signal).then((response) =>
            dropUnplayable(response.results.map(adaptJamendoTrack)),
          ),
        ])

        const [artistSources, trackSources] = values
        const rawArtist = artistSources[0]
        const tracks = trackSources[0] ?? []
        if (!rawArtist) throw new Error('not found')

        return { artist: adaptJamendoArtist(rawArtist), tracks }
      }

      if (id.startsWith('audius:')) {
        const rawId = id.slice('audius:'.length)
        const response = await audiusUserTracks(rawId, { limit: 50 }, signal)
        const tracks = dropUnplayable(response.data.map(adaptAudiusTrack))

        if (tracks.length === 0) throw new Error('not found')

        const first = tracks[0]
        return {
          artist: {
            id: `audius:${rawId}`,
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

      throw new Error('unsupported source')
    },
    staleTime: 1000 * 60 * 30,
  })

export const useTrack = (slug: string): UseQueryResult<Track> =>
  useQuery({
    queryKey: ['track', slug],
    enabled: slug.length > 0,
    queryFn: async ({ signal }) => {
      const { id } = parseSlug(slug)

      if (id.startsWith('jamendo:')) {
        const response = await jamendoTrackById(
          id.slice('jamendo:'.length),
          { ...TRACK_PARAMS, limit: 1 },
          signal,
        )
        const track = response.results[0]
        if (!track) throw new Error('not found')
        return adaptJamendoTrack(track)
      }

      if (id.startsWith('audius:')) {
        const response = await audiusTrackById(id.slice('audius:'.length), {}, signal)
        const track = response.data[0]
        if (!track) throw new Error('not found')
        return adaptAudiusTrack(track)
      }

      throw new Error('unsupported source')
    },
    staleTime: 1000 * 60 * 30,
  })

export const useGenreTracks = (tag: string): UseInfiniteQueryResult<{
  pages: Page<Track>[]
  pageParams: number[]
}> =>
  useInfiniteQuery({
    queryKey: ['genre', tag],
    initialPageParam: 0,
    enabled: tag.length > 0,
    queryFn: ({ pageParam, signal }) => {
      const offset = pageParam as number
      return fetchJamendoTracks({ tags: tag, order: 'popularity_week' }, offset, PAGE_SIZE, signal).then(
        (items) => ({
          pages: [toPage(items, offset, PAGE_SIZE, items.length)],
          pageParams: [offset],
        }),
      )
    },
    getNextPageParam: (lastPage) => {
      const page = lastPage.pages.at(-1)
      return page?.hasMore ? page.offset + PAGE_SIZE : undefined
    },
    staleTime: 1000 * 60 * 10,
  })

export const usePrefetchTrack = () => {
  const queryClient = useQueryClient()

  return (track: Track) => {
    void queryClient.prefetchQuery({
      queryKey: ['track', track.slug],
      queryFn: async ({ signal }) => {
        const { id } = parseSlug(track.slug)
        if (id.startsWith('jamendo:')) {
          const response = await jamendoTrackById(
            id.slice('jamendo:'.length),
            { ...TRACK_PARAMS, limit: 1 },
            signal,
          )
          const raw = response.results[0]
          return raw ? adaptJamendoTrack(raw) : track
        }
        return track
      },
      staleTime: 1000 * 60 * 5,
    })
  }
}

export { adaptAudiusAlbum }
