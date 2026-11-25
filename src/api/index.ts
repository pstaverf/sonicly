import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query'

import type { Album, Artist, Page, Playlist, SearchResults, Track } from '../types'
import { parseSlug } from '../lib/slug'

import {
  fetchAlbum,
  fetchAlbums,
  fetchArtist,
  fetchArtists,
  fetchAudiusTracks,
  fetchChart,
  fetchGenrePage,
  fetchJamendoTracks,
  fetchNewReleases,
  fetchPlaylist,
  fetchPlaylistsOfDay,
  fetchPopular,
  fetchSearch,
  fetchTrack,
  PAGE_SIZE,
  TRACK_PARAMS,
  toPage,
} from './fetchers'
import { adaptJamendoTrack } from './adapters/jamendo'

export { PAGE_SIZE } from './fetchers'

export const useInfiniteTracks = (
  query: {
    tags?: string
    search?: string
    order?: string
    albumId?: string
    artistId?: string
    genre?: string
  },
  options?: { source?: 'jamendo' | 'audius' | 'both' },
): UseInfiniteQueryResult<{ pages: Page<Track>[]; pageParams: number[] }> => {
  const source = options?.source ?? 'both'

  return useInfiniteQuery({
    queryKey: ['tracks', 'infinite', query, source],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      const page = pageParam as number
      const offset = page * PAGE_SIZE

      if (source === 'jamendo') {
        return fetchJamendoTracks(query, offset, PAGE_SIZE, signal).then((items) => ({
          pages: [toPage(items, offset, PAGE_SIZE, items.length >= PAGE_SIZE)],
          pageParams: [page],
        }))
      }

      if (source === 'audius') {
        return fetchAudiusTracks(query, offset, PAGE_SIZE, signal).then((items) => ({
          pages: [toPage(items, offset, PAGE_SIZE, items.length >= PAGE_SIZE)],
          pageParams: [page],
        }))
      }

      return Promise.all([
        fetchJamendoTracks(query, offset, PAGE_SIZE, signal),
        fetchAudiusTracks(query, offset, PAGE_SIZE, signal),
      ]).then(([jamendo, audius]) => ({
        pages: [
          toPage(
            [...jamendo, ...audius],
            offset,
            PAGE_SIZE,
            jamendo.length >= PAGE_SIZE || audius.length >= PAGE_SIZE,
          ),
        ],
        pageParams: [page],
      }))
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage.pages.at(-1)
      return last?.hasMore ? (last.offset / PAGE_SIZE) + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useNewReleases = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'new'],
    queryFn: ({ signal }) => fetchNewReleases(signal),
    staleTime: 1000 * 60 * 10,
  })

export const usePopular = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'popular'],
    queryFn: ({ signal }) => fetchPopular(signal),
    staleTime: 1000 * 60 * 10,
  })

export const useChart = (): UseQueryResult<Track[]> =>
  useQuery({
    queryKey: ['home', 'chart'],
    queryFn: ({ signal }) => fetchChart(signal),
    staleTime: 1000 * 60 * 10,
  })

export const usePlaylistsOfDay = (): UseQueryResult<Playlist[]> =>
  useQuery({
    queryKey: ['home', 'playlists'],
    queryFn: ({ signal }) => fetchPlaylistsOfDay(signal),
    staleTime: 1000 * 60 * 30,
  })

export const useAlbums = (): UseQueryResult<Album[]> =>
  useQuery({
    queryKey: ['home', 'albums'],
    queryFn: ({ signal }) => fetchAlbums(signal),
    staleTime: 1000 * 60 * 30,
  })

export const useArtists = (): UseQueryResult<Artist[]> =>
  useQuery({
    queryKey: ['home', 'artists'],
    queryFn: ({ signal }) => fetchArtists(signal),
    staleTime: 1000 * 60 * 30,
  })

export const useSearch = (query: string): UseQueryResult<SearchResults> =>
  useQuery({
    queryKey: ['search', query],
    enabled: query.trim().length > 0,
    queryFn: ({ signal }) => fetchSearch(query.trim(), signal),
    staleTime: 1000 * 60 * 2,
  })

export const useAlbum = (slug: string): UseQueryResult<{ album: Album; tracks: Track[] }> =>
  useQuery({
    queryKey: ['album', slug],
    enabled: slug.length > 0,
    queryFn: ({ signal }) => fetchAlbum(slug, signal),
    staleTime: 1000 * 60 * 30,
  })

export const usePlaylist = (slug: string): UseQueryResult<{ playlist: Playlist; tracks: Track[] }> =>
  useQuery({
    queryKey: ['playlist', slug],
    enabled: slug.length > 0,
    queryFn: ({ signal }) => fetchPlaylist(slug, signal),
    staleTime: 1000 * 60 * 30,
  })

export const useArtist = (slug: string): UseQueryResult<{ artist: Artist; tracks: Track[] }> =>
  useQuery({
    queryKey: ['artist', slug],
    enabled: slug.length > 0,
    queryFn: ({ signal }) => fetchArtist(slug, signal),
    staleTime: 1000 * 60 * 30,
  })

export const useTrack = (slug: string): UseQueryResult<Track> =>
  useQuery({
    queryKey: ['track', slug],
    enabled: slug.length > 0,
    queryFn: ({ signal }) => fetchTrack(slug, signal),
    staleTime: 1000 * 60 * 30,
  })

export const useGenreTracks = (
  tag: string,
): UseInfiniteQueryResult<{ pages: Page<Track>[]; pageParams: number[] }> =>
  useInfiniteQuery({
    queryKey: ['genre', tag],
    initialPageParam: 0,
    enabled: tag.length > 0,
    queryFn: ({ pageParam, signal }) => {
      const page = pageParam as number
      const offset = page * PAGE_SIZE

      return fetchGenrePage(tag, offset, signal).then((pageData) => ({
        pages: [pageData],
        pageParams: [page],
      }))
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage.pages.at(-1)
      return last?.hasMore ? (last.offset / PAGE_SIZE) + 1 : undefined
    },
    staleTime: 1000 * 60 * 10,
  })

export const useWaveTracks = (
  genres: string[],
): UseInfiniteQueryResult<{ pages: Page<Track>[]; pageParams: number[] }> =>
  useInfiniteQuery({
    queryKey: ['wave', genres],
    initialPageParam: 0,
    enabled: genres.length > 0,
    queryFn: ({ pageParam, signal }) => {
      const page = pageParam as number
      const offset = page * PAGE_SIZE
      const tag = genres[page % genres.length]

      return fetchJamendoTracks({ tags: tag, order: 'popularity_week' }, offset, PAGE_SIZE, signal).then(
        async (items) => {
          let tracks = items
          let hasMore = items.length >= PAGE_SIZE

          if (tracks.length < PAGE_SIZE) {
            const filler = await fetchAudiusTracks({}, 0, PAGE_SIZE - tracks.length, signal)
            tracks = [...tracks, ...filler]
            hasMore = items.length >= PAGE_SIZE || filler.length > 0
          }

          return {
            pages: [toPage(tracks, offset, PAGE_SIZE, hasMore)],
            pageParams: [page],
          }
        },
      )
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage.pages.at(-1)
      return last?.hasMore ? (last.offset / PAGE_SIZE) + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
  })

export const usePrefetchTrack = () => {
  const queryClient = useQueryClient()

  return (track: Track) => {
    void queryClient.prefetchQuery({
      queryKey: ['track', track.slug],
      queryFn: async ({ signal }) => {
        const parsed = parseSlug(track.slug)

        if (parsed.source === 'jamendo') {
          const response = await fetchTrack(track.slug, signal)
          return response ?? track
        }

        return track
      },
      staleTime: 1000 * 60 * 5,
    })
  }
}

export { adaptJamendoTrack, TRACK_PARAMS }
