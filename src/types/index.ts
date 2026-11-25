export type Source = 'jamendo' | 'audius'

export type Language = 'ru' | 'en'

export type Theme = 'dark' | 'light'

export type RepeatMode = 'off' | 'all' | 'one'

export interface Track {
  id: string
  source: Source
  slug: string
  title: string
  artistId: string
  artistName: string
  artistSlug: string
  albumId: string | null
  albumTitle: string | null
  albumSlug: string | null
  coverUrl: string
  streamUrl: string
  duration: number
  releaseDate: string
  genres: string[]
  licenseUrl: string | null
  licenseLabel: string | null
  plays: number
  likes: number
  mood: string | null
  shareUrl: string
}

export interface Album {
  id: string
  source: Source
  slug: string
  title: string
  artistId: string
  artistName: string
  artistSlug: string
  coverUrl: string
  releaseDate: string
  trackCount: number
  shareUrl: string
}

export interface Artist {
  id: string
  source: Source
  slug: string
  name: string
  imageUrl: string
  bio: string | null
  website: string | null
  followers: number
  trackCount: number
}

export interface Playlist {
  id: string
  source: Source
  slug: string
  title: string
  author: string
  coverUrl: string
  trackCount: number
  shareUrl: string
}

export interface User {
  id: string
  email: string | null
  name: string
  avatarUrl: string
  isGuest: boolean
}

export interface LocalPlaylist {
  id: string
  title: string
  trackIds: string[]
  createdAt: number
}

export interface SearchResults {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
}

export interface Page<T> {
  items: T[]
  offset: number
  limit: number
  hasMore: boolean
}

export interface Genre {
  slug: string
  label: string
  tag: string
  mood: string | null
  audiusGenres: string[]
}

export interface AttributedLink {
  label: string
  url: string
}
