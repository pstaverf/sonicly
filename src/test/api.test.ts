import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { adaptAudiusTrack } from '../api/adapters/audius'
import { adaptJamendoPlaylistTrack, adaptJamendoTrack } from '../api/adapters/jamendo'
import { dropUnplayable, merge, settle, toPage } from '../api/fetchers'
import { buildQuery, requestJson, ApiError } from '../api/client'
import { buildSlug, parseSlug, slugify } from '../lib/slug'
import type { Track } from '../types'

const jamendoRaw = {
  id: '123456',
  name: 'Test Track',
  duration: 210,
  artist_id: '42',
  artist_name: 'Test Artist',
  album_name: 'Test Album',
  album_id: '77',
  audio: 'https://mp3l.jamendo.com/?trackid=123456',
  releasedate: '2024-01-15',
  image: 'https://prod-1.storage.jamendo.com/?trackid=123456&imageview=viewer',
  shareurl: 'https://www.jamendo.com/track/123456',
  musicinfo: { tags: { genres: ['rock', 'indie'] } },
  license_ccurl: 'https://creativecommons.org/licenses/by/3.0/',
}

const audiusRaw = {
  id: 'abc123',
  track_id: 998877,
  title: 'Audius Track',
  duration: 180,
  play_count: 4200,
  favorite_count: 120,
  genre: 'Electronic',
  mood: 'Energizing',
  tags: 'edm,house',
  release_date: '2024-03-01T00:00:00Z',
  permalink: '/artist/audius-track',
  artwork: { '1000x1000': 'https://example.com/art.jpg' },
  stream: { url: 'https://stream.example.com/abc123' },
  user: { id: 'handle1', name: 'Audius Artist' },
}

describe('slug helpers', () => {
  it('transliterates cyrillic titles', () => {
    expect(slugify('Привет Мир')).toBe('privet-mir')
  })

  it('encodes the source into the slug', () => {
    const slug = buildSlug('Test Track', 'jamendo', '123456')

    expect(slug).toBe('test-track-jamendo-123456')

    const parsed = parseSlug(slug)
    expect(parsed.source).toBe('jamendo')
    expect(parsed.id).toBe('123456')
    expect(parsed.name).toBe('test-track')
  })

  it('parses audius slugs', () => {
    const parsed = parseSlug(buildSlug('Audius Track', 'audius', 'abc123'))

    expect(parsed.source).toBe('audius')
    expect(parsed.id).toBe('abc123')
  })

  it('returns a null source for unknown slugs', () => {
    expect(parseSlug('mystery').source).toBeNull()
  })
})

describe('adapters', () => {
  it('maps jamendo tracks to the unified shape', () => {
    const track = adaptJamendoTrack(jamendoRaw as never)

    expect(track.id).toBe('jamendo:123456')
    expect(track.source).toBe('jamendo')
    expect(track.streamUrl).toContain('jamendo.com')
    expect(track.genres).toEqual(['rock', 'indie'])
    expect(track.licenseLabel).toBe('CC BY')
    expect(track.artistSlug).toContain('jamendo-42')
  })

  it('maps audius tracks to the unified shape', () => {
    const track = adaptAudiusTrack(audiusRaw as never)

    expect(track.id).toBe('audius:abc123')
    expect(track.source).toBe('audius')
    expect(track.plays).toBe(4200)
    expect(track.likes).toBe(120)
    expect(track.mood).toBe('Energizing')
    expect(track.coverUrl).toBe('https://example.com/art.jpg')
  })

  it('drops tracks without a playable stream', () => {
    const broken = { ...adaptJamendoTrack(jamendoRaw as never), streamUrl: '' }
    const playable = adaptJamendoTrack(jamendoRaw as never)

    expect(dropUnplayable([broken, playable])).toHaveLength(1)
  })
})

describe('jamendo playlist tracks', () => {
  const playlistTrack = {
    id: '235',
    name: "Natural Sheen - What's your opinion?",
    album_id: '32',
    artist_id: '15',
    artist_name: 'Various Artists',
    duration: '216',
    position: '3',
    license_ccurl: 'http://artlibre.org/licence/lal/',
    album_image: 'https://usercontent.jamendo.com?type=album&id=32&width=300&trackid=235',
    image: 'https://usercontent.jamendo.com?type=album&id=32&width=300&trackid=235',
    audio: 'https://prod-1.storage.jamendo.com/?trackid=235&format=mp32',
  }

  it('maps a playlist track to the unified shape', () => {
    const track = adaptJamendoPlaylistTrack(playlistTrack)

    expect(track.id).toBe('jamendo:235')
    expect(track.source).toBe('jamendo')
    expect(track.duration).toBe(216)
    expect(track.artistName).toBe('Various Artists')
    expect(track.licenseLabel).toBe('Licence Art Libre')
  })

  it('upgrades the license link to https', () => {
    const track = adaptJamendoPlaylistTrack(playlistTrack)

    expect(track.licenseUrl).toBe('https://artlibre.org/licence/lal/')
  })

  it('derives a share link when the api omits it', () => {
    const track = adaptJamendoPlaylistTrack(playlistTrack)

    expect(track.shareUrl).toBe('https://www.jamendo.com/track/235')
  })
})

describe('query helpers', () => {
  it('serializes arrays as a plus separated list', () => {
    expect(buildQuery({ include: ['musicinfo', 'licenses'] })).toBe('include=musicinfo%2Blicenses')
  })

  it('skips undefined parameters', () => {
    expect(buildQuery({ limit: 10, offset: undefined })).toBe('limit=10')
  })

  it('keeps settled values and drops rejected ones', async () => {
    const groups = await settle([
      Promise.resolve(['a']),
      Promise.reject(new Error('boom')),
      Promise.resolve(['c']),
    ])

    expect(groups[0]).toEqual(['a'])
    expect(groups[1]).toBeUndefined()
    expect(groups[2]).toEqual(['c'])
  })

  it('merges optional groups', () => {
    expect(merge([['a'], undefined, ['b']])).toEqual(['a', 'b'])
  })

  it('computes pagination flags', () => {
    expect(toPage([1, 2], 0, 2, true).hasMore).toBe(true)
    expect(toPage([1], 0, 2, false).hasMore).toBe(false)
  })
})

describe('http client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws an ApiError on network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'))

    await expect(requestJson('https://example.com', 'jamendo')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws an ApiError with the response status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'unavailable' })

    await expect(requestJson('https://example.com', 'audius')).rejects.toMatchObject({
      status: 503,
      source: 'audius',
    })
  })

  it('returns parsed json', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })

    await expect(requestJson('https://example.com', 'jamendo')).resolves.toEqual({ ok: true })
  })
})

describe('unified track contract', () => {
  it('always exposes the source field', () => {
    const track: Track = adaptJamendoTrack(jamendoRaw as never)

    expect(['jamendo', 'audius']).toContain(track.source)
    expect(track.slug).toContain(track.source)
  })
})
