import type { Genre } from '../types'

export const genres: Genre[] = [
  {
    slug: 'pop',
    label: 'Pop',
    tag: 'pop',
    mood: null,
    audiusGenres: ['Pop'],
  },
  {
    slug: 'rock',
    label: 'Rock',
    tag: 'rock',
    mood: null,
    audiusGenres: ['Rock', 'Punk', 'Metal'],
  },
  {
    slug: 'electronic',
    label: 'Electronic',
    tag: 'electronic',
    mood: null,
    audiusGenres: ['Electronic', 'House', 'Techno', 'Dance', 'Trap'],
  },
  {
    slug: 'hiphop',
    label: 'Hip-Hop',
    tag: 'hiphop',
    mood: null,
    audiusGenres: ['Hip-Hop', 'Trap', 'R&B'],
  },
  {
    slug: 'jazz',
    label: 'Jazz',
    tag: 'jazz',
    mood: null,
    audiusGenres: ['Jazz'],
  },
  {
    slug: 'lounge',
    label: 'Lounge',
    tag: 'lounge',
    mood: null,
    audiusGenres: ['Lo-Fi', 'Chill'],
  },
  {
    slug: 'ambient',
    label: 'Ambient',
    tag: 'ambient',
    mood: null,
    audiusGenres: ['Ambient', 'Experimental'],
  },
  {
    slug: 'classical',
    label: 'Classical',
    tag: 'classical',
    mood: null,
    audiusGenres: ['Classical'],
  },
  {
    slug: 'chillout',
    label: 'Chillout',
    tag: 'chillout',
    mood: 'Chill',
    audiusGenres: ['Chill', 'Lo-Fi', 'Ambient'],
  },
  {
    slug: 'deep',
    label: 'Deep House',
    tag: 'deep',
    mood: 'Deep',
    audiusGenres: ['House', 'Techno', 'Electronic'],
  },
  {
    slug: 'relaxation',
    label: 'Relaxation',
    tag: 'relaxation',
    mood: 'Relax',
    audiusGenres: ['Ambient', 'Chill', 'Classical'],
  },
  {
    slug: 'world',
    label: 'World',
    tag: 'world',
    mood: null,
    audiusGenres: ['Afrobeats', 'Reggae', 'Latin', 'World'],
  },
]

export const genreBySlug = (slug: string): Genre | undefined =>
  genres.find((genre) => genre.slug === slug)

export const genreByTag = (tag: string): Genre | undefined =>
  genres.find((genre) => genre.tag === tag)
