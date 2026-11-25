import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { jamendoPlaylistTracks, jamendoAlbumTracks, jamendoTrackById } from '../api/jamendo'
import { audiusTrackById, audiusUserTracks, audiusPlaylistTracks } from '../api/audius'
import { adaptJamendoPlaylistTrack } from '../api/adapters/jamendo'
import { adaptAudiusTrack } from '../api/adapters/audius'

/**
 * The live contracts of Jamendo and Audius are not frozen by a schema, so
 * these tests pin the request shape and the response shape that the clients
 * rely on. A change in either one has to be a deliberate change here too.
 */

interface Call {
  url: string
}

const calls: Call[] = []

let payload: unknown = {}
let lastUrl = ''

beforeEach(() => {
  calls.length = 0
  lastUrl = ''
  payload = {}

  vi.stubGlobal('fetch', async (url: string) => {
    lastUrl = String(url)
    calls.push({ url: String(url) })
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
    } as Response
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const query = (url: string, key: string): string | null =>
  new URL(url).searchParams.get(key)

describe('jamendo playlist tracks', () => {
  const playlistTrack = {
    id: '235',
    name: 'Natural Sheen',
    album_id: '32',
    artist_id: '15',
    artist_name: 'Various Artists',
    duration: '216',
    position: '3',
    license_ccurl: 'http://artlibre.org/licence/lal/',
    album_image: 'https://usercontent.jamendo.com?type=album&id=32&width=300',
    image: 'https://usercontent.jamendo.com?type=album&id=32&width=300',
    audio: 'https://prod-1.storage.jamendo.com/?trackid=235&format=mp32',
  }

  it('asks the playlist endpoint for the playlist id', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '11696', name: 'Mix', tracks: [playlistTrack] }] }

    await jamendoPlaylistTracks({ id: '11696', limit: 100 })

    expect(lastUrl).toContain('/v3.0/playlists/tracks?')
    expect(query(lastUrl, 'id')).toBe('11696')
  })

  it('never sends the include parameter the endpoint rejects', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '11696', name: 'Mix', tracks: [playlistTrack] }] }

    await jamendoPlaylistTracks({ id: '11696', limit: 100 })

    expect(query(lastUrl, 'include')).toBeNull()
  })

  it('sends the track type and the audio format the endpoint wants', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '11696', name: 'Mix', tracks: [playlistTrack] }] }

    await jamendoPlaylistTracks({ id: '11696', limit: 100 })

    expect(query(lastUrl, 'track_type')).toBe('single albumtrack')
    expect(query(lastUrl, 'audioformat')).toBe('mp32')
    expect(query(lastUrl, 'imagesize')).toBe('600')
  })

  it('reads the tracks from the nested playlist object', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '11696', name: 'Mix', tracks: [playlistTrack] }] }

    const response = await jamendoPlaylistTracks({ id: '11696', limit: 100 })
    const playlist = response.results[0]
    const track = adaptJamendoPlaylistTrack(playlist.tracks?.[0] as never)

    expect(playlist.tracks).toHaveLength(1)
    expect(track.id).toBe('jamendo:235')
    expect(track.duration).toBe(216)
    expect(track.licenseUrl).toBe('https://artlibre.org/licence/lal/')
    expect(track.albumSlug).toBeNull()
  })
})

describe('jamendo album tracks', () => {
  it('reads the album tracks from the tracks endpoint', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '99', name: 'Album Track' }] }

    await jamendoAlbumTracks('145774', { include: ['musicinfo', 'licenses'], limit: 100 })

    expect(lastUrl).toContain('/v3.0/tracks?')
    expect(query(lastUrl, 'album_id')).toBe('145774')
    expect(query(lastUrl, 'type')).toBe('single albumtrack')
    expect(query(lastUrl, 'include')).toBe('musicinfo+licenses')
  })
})

describe('jamendo track detail', () => {
  it('asks for the licences so the license link is present', async () => {
    payload = { headers: { results_count: 1 }, results: [{ id: '123456', name: 'Test Track' }] }

    await jamendoTrackById('123456', { include: ['musicinfo', 'licenses'], limit: 1 })

    expect(query(lastUrl, 'id')).toBe('123456')
    expect(query(lastUrl, 'include')).toBe('musicinfo+licenses')
  })
})

describe('audius detail endpoints', () => {
  const track = {
    id: 'mRaOxp1',
    track_id: 123,
    title: 'Track',
    duration: 100,
    play_count: 1,
    favorite_count: 2,
    genre: 'Bass',
    mood: 'Energizing',
    tags: 'dub',
    release_date: '2026-01-01T00:00:00Z',
    permalink: '/artist/track',
    artwork: { '1000x1000': 'https://cdn.test/art.jpg' },
    stream: { url: 'https://cdn.test/stream.mp3' },
    user: { id: 'B0gPY79', name: 'parasox' },
  }

  it('reads a track detail from the object in data', async () => {
    payload = { data: track }

    const response = await audiusTrackById('mRaOxp1', {})
    const adapted = adaptAudiusTrack(response.data)

    expect(lastUrl).toContain('/v1/tracks/mRaOxp1?')
    expect(adapted.id).toBe('audius:mRaOxp1')
    expect(adapted.streamUrl).toBe('https://cdn.test/stream.mp3')
    expect(adapted.artistSlug).toBe('parasox-audius-B0gPY79')
  })

  it('reads the user tracks from a list in data', async () => {
    payload = { data: [track] }

    const response = await audiusUserTracks('B0gPY79', { limit: 50 })

    expect(lastUrl).toContain('/v1/users/B0gPY79/tracks?')
    expect(response.data).toHaveLength(1)
  })

  it('reads a playlist detail from the list in data', async () => {
    payload = {
      data: [
        {
          playlist_id: 554298735,
          playlist_name: 'Toadally, Dude',
          slug: 'toadally-dude',
          is_album: true,
          total_play_count: 814,
          favorite_count: 14,
          repost_count: 13,
          release_date: '2026-11-19T15:11:32Z',
          user: { id: 'B0gPY79', name: 'parasox' },
          tracks: [track],
        },
      ],
    }

    const response = await audiusPlaylistTracks('554298735', {})

    expect(lastUrl).toContain('/v1/playlists/554298735?')
    expect(response.data).toHaveLength(1)
    expect(response.data[0].playlist_name).toBe('Toadally, Dude')
    expect(response.data[0].tracks).toHaveLength(1)
  })
})
