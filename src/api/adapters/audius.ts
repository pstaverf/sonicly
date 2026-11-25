import type { Album, Artist, Playlist, Track } from '../../types'
import { buildSlug } from '../../lib/slug'
import type { AudiusArtwork, AudiusPlaylist, AudiusTrack, AudiusUser } from '../audius'

const artworkUrl = (artwork: AudiusArtwork | undefined, size = 1000): string =>
  artwork?.[size === 1000 ? '1000x1000' : '480x480'] ??
  artwork?.['1000x1000'] ??
  artwork?.['480x480'] ??
  artwork?.['150x150'] ??
  ''

const parseTags = (tags: string | null): string[] =>
  tags
    ? tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : []

export const adaptAudiusTrack = (track: AudiusTrack): Track => {
  const artist = track.user
  const artistId = artist?.id ?? 'unknown'
  const artistName = artist?.name ?? 'Unknown Artist'
  const album = track.album_backlink

  return {
    id: `audius:${track.id}`,
    source: 'audius',
    slug: buildSlug(track.title, track.id),
    title: track.title,
    artistId: `audius:${artistId}`,
    artistName,
    artistSlug: buildSlug(artistName, artistId),
    albumId: album ? `audius:${album.playlist_id}` : null,
    albumTitle: album?.playlist_name ?? null,
    albumSlug: album ? buildSlug(album.playlist_name, String(album.playlist_id)) : null,
    coverUrl: artworkUrl(track.artwork, 1000),
    streamUrl: track.stream?.url ?? '',
    duration: Number(track.duration) || 0,
    releaseDate: track.release_date,
    genres: track.genre ? [track.genre] : parseTags(track.tags),
    licenseUrl: null,
    licenseLabel: track.genre ? null : 'Audius',
    plays: track.play_count,
    likes: track.favorite_count,
    mood: track.mood,
    shareUrl: `https://audius.co${track.permalink}`,
  }
}

export const adaptAudiusArtist = (user: AudiusUser): Artist => ({
  id: `audius:${user.id}`,
  source: 'audius',
  slug: buildSlug(user.name, user.id),
  name: user.name,
  imageUrl: artworkUrl(user.cover_photo ?? user.profile_picture, 1000),
  bio: user.bio,
  website: user.website,
  followers: user.follower_count,
  trackCount: user.track_count,
})

export const adaptAudiusPlaylist = (playlist: AudiusPlaylist): Playlist => ({
  id: `audius:${playlist.playlist_id}`,
  source: 'audius',
  slug: buildSlug(playlist.playlist_name, String(playlist.playlist_id)),
  title: playlist.playlist_name,
  author: playlist.user?.name ?? 'Audius',
  coverUrl: artworkUrl(playlist.artwork, 1000),
  trackCount: playlist.tracks?.length ?? 0,
  shareUrl: `https://audius.co/playlist/${playlist.slug}`,
})

export const adaptAudiusAlbum = (playlist: AudiusPlaylist): Album => ({
  id: `audius:${playlist.playlist_id}`,
  source: 'audius',
  slug: buildSlug(playlist.playlist_name, String(playlist.playlist_id)),
  title: playlist.playlist_name,
  artistId: `audius:${playlist.user?.id ?? 'unknown'}`,
  artistName: playlist.user?.name ?? 'Unknown Artist',
  artistSlug: buildSlug(playlist.user?.name ?? 'Unknown Artist', playlist.user?.id ?? 'unknown'),
  coverUrl: artworkUrl(playlist.artwork, 1000),
  releaseDate: playlist.release_date ?? '',
  trackCount: playlist.tracks?.length ?? 0,
  shareUrl: `https://audius.co/playlist/${playlist.slug}`,
})
