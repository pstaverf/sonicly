import type { Genre } from '../types'

export const genres: Genre[] = [
  { slug: 'pop', label: 'Pop', tag: 'pop', mood: null },
  { slug: 'rock', label: 'Rock', tag: 'rock', mood: null },
  { slug: 'electronic', label: 'Electronic', tag: 'electronic', mood: null },
  { slug: 'hiphop', label: 'Hip-Hop', tag: 'hiphop', mood: null },
  { slug: 'jazz', label: 'Jazz', tag: 'jazz', mood: null },
  { slug: 'lounge', label: 'Lounge', tag: 'lounge', mood: null },
  { slug: 'ambient', label: 'Ambient', tag: 'ambient', mood: null },
  { slug: 'classical', label: 'Classical', tag: 'classical', mood: null },
  { slug: 'chillout', label: 'Chillout', tag: 'chillout', mood: 'Chill' },
  { slug: 'deep', label: 'Deep House', tag: 'deep', mood: 'Deep' },
  { slug: 'relaxation', label: 'Relaxation', tag: 'relaxation', mood: 'Relax' },
  { slug: 'world', label: 'World', tag: 'world', mood: null },
]

export const genreBySlug = (slug: string): Genre | undefined =>
  genres.find((genre) => genre.slug === slug)
