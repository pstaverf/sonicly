export interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string
  audioUrl: string
  duration: number
  likes: number
  genre: string
}

export interface Album {
  id: string
  title: string
  artist: string
  coverUrl: string
  tracks: Track[]
  releaseYear: number
}

export interface Playlist {
  id: string
  title: string
  tracks: Track[]
  isPublic: boolean
}

export interface Artist {
  id: string
  name: string
  bio: string
  followers: number
}

export interface User {
  id: string
  name: string
  avatarUrl: string
  isGuest: boolean
}

export type Theme = 'dark' | 'light'
export type Language = 'ru' | 'en'
export type RepeatMode = 'none' | 'one' | 'all'
