import { describe, expect, it } from 'vitest'

import { albums, fetchAlbum, fetchPlaylist, fetchTracks, playlists, tracks } from '../api'

describe('mock api', () => {
  it('exposes twenty tracks', () => {
    expect(tracks).toHaveLength(20)
  })

  it('gives every track a unique id and resolvable cover path', () => {
    const ids = new Set(tracks.map((track) => track.id))
    expect(ids.size).toBe(tracks.length)

    for (const track of tracks) {
      expect(track.title.length).toBeGreaterThan(0)
      expect(track.artist.length).toBeGreaterThan(0)
      expect(track.coverUrl).toMatch(/^\/covers\/\d+\.jpg$/)
      expect(track.audioUrl).toMatch(/^\/audio\/\d+\.mp3$/)
      expect(track.duration).toBeGreaterThan(0)
    }
  })

  it('resolves tracks after the mock latency', async () => {
    const started = Date.now()
    const result = await fetchTracks()
    const elapsed = Date.now() - started

    expect(result).toHaveLength(20)
    expect(elapsed).toBeGreaterThanOrEqual(280)
    expect(elapsed).toBeLessThan(2000)
  })

  it('returns albums that reference known tracks', async () => {
    const album = await fetchAlbum('1')

    expect(album).not.toBeNull()
    expect(album.tracks.length).toBeGreaterThan(0)
    expect(album.releaseYear).toBeGreaterThan(2000)
    expect(albums.some((item) => item.id === album.id)).toBe(true)
  })

  it('returns playlists with tracks and visibility flags', async () => {
    const playlist = await fetchPlaylist('1')

    expect(playlist).not.toBeNull()
    expect(playlist.tracks.length).toBeGreaterThan(0)
    expect(typeof playlist.isPublic).toBe('boolean')
    expect(playlists.some((item) => item.id === playlist.id)).toBe(true)
  })
})
