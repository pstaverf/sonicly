import type {
  Album,
  Artist,
  Playlist,
  Track,
} from '../../types'
import { buildSlug, slugify } from '../../lib/slug'
import type {
  JamendoAlbum,
  JamendoArtist,
  JamendoPlaylist,
  JamendoTrack,
} from '../jamendo'

const LICENSE_LABELS: Record<string, string> = {
  'creativecommons.org/licenses/by/': 'CC BY',
  'creativecommons.org/licenses/by-sa/': 'CC BY-SA',
  'creativecommons.org/licenses/by-nc/': 'CC BY-NC',
  'creativecommons.org/licenses/by-nd/': 'CC BY-ND',
  'creativecommons.org/licenses/by-nc-sa/': 'CC BY-NC-SA',
  'creativecommons.org/licenses/by-nc-nd/': 'CC BY-NC-ND',
  'artlibre.org/licence/lal/': 'Licence Art Libre',
}

const licenseLabel = (url: string | null): string | null => {
  if (!url) return null

  const matched = Object.entries(LICENSE_LABELS).find(([prefix]) => url.includes(prefix))
  return matched ? matched[1] : 'Creative Commons'
}

const coverFrom = (image: string, size = 600): string => {
  if (!image) return ''
  return image.replace(/width=\d+/, `width=${size}`)
}

export const adaptJamendoTrack = (track: JamendoTrack): Track => {
  const genres = track.musicinfo?.tags?.genres ?? []
  const albumId = track.album_id || null
  const artistId = track.artist_id

  return {
    id: `jamendo:${track.id}`,
    source: 'jamendo',
    slug: buildSlug(track.name, track.id),
    title: track.name,
    artistId: `jamendo:${artistId}`,
    artistName: track.artist_name,
    artistSlug: buildSlug(track.artist_name, artistId),
    albumId: albumId ? `jamendo:${albumId}` : null,
    albumTitle: track.album_name || null,
    albumSlug: albumId ? buildSlug(track.album_name, albumId) : null,
    coverUrl: coverFrom(track.image || track.album_image),
    streamUrl: track.audio,
    duration: Number(track.duration) || 0,
    releaseDate: track.releasedate,
    genres,
    licenseUrl: track.license_ccurl || null,
    licenseLabel: licenseLabel(track.license_ccurl || null),
    plays: 0,
    likes: 0,
    mood: null,
    shareUrl: track.shareurl,
  }
}

export const adaptJamendoAlbum = (album: JamendoAlbum): Album => ({
  id: `jamendo:${album.id}`,
  source: 'jamendo',
  slug: buildSlug(album.name, album.id),
  title: album.name,
  artistId: `jamendo:${album.artist_id}`,
  artistName: album.artist_name,
  artistSlug: buildSlug(album.artist_name, album.artist_id),
  coverUrl: coverFrom(album.image),
  releaseDate: album.releasedate,
  trackCount: 0,
  shareUrl: album.shareurl,
})

export const adaptJamendoArtist = (artist: JamendoArtist): Artist => ({
  id: `jamendo:${artist.id}`,
  source: 'jamendo',
  slug: buildSlug(artist.name, artist.id),
  name: artist.name,
  imageUrl: coverFrom(artist.image, 300),
  bio: null,
  website: artist.website || null,
  followers: 0,
  trackCount: 0,
})

export const adaptJamendoPlaylist = (playlist: JamendoPlaylist): Playlist => ({
  id: `jamendo:${playlist.id}`,
  source: 'jamendo',
  slug: buildSlug(playlist.name, playlist.id),
  title: playlist.name,
  author: playlist.user_name,
  coverUrl: '',
  trackCount: playlist.tracks?.length ?? 0,
  shareUrl: playlist.shareurl,
})

export const jamendoPlaylistSlug = (name: string, id: string): string =>
  slugify(name) ? buildSlug(name, id) : id
