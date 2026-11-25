import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Track } from '../types'

interface FakeHowl {
  options: { src: string[] }
  handlers: Record<string, (value?: unknown) => void>
  durationValue: number
  unloaded: boolean
  played: boolean
}

const sounds = vi.hoisted(() => [] as FakeHowl[])

vi.mock('howler', () => {
  class Howl {
    handlers: Record<string, (value?: unknown) => void> = {}
    durationValue = 0
    unloaded = false
    played = false

    constructor(public options: { src: string[] }) {
      sounds.push(this as unknown as FakeHowl)
    }

    on(event: string, fn: (value?: unknown) => void) {
      this.handlers[event] = fn
    }

    off(event: string) {
      delete this.handlers[event]
    }

    duration() {
      return this.durationValue
    }

    play() {
      this.played = true
    }

    pause() {}

    stop() {}

    unload() {
      this.unloaded = true
    }

    seek() {
      return 0
    }

    volume() {}
  }

  return { Howl }
})

const { loadTrack, preloadTrack, unload } = await import('../lib/player')

const makeTrack = (id: string, streamUrl: string): Track => ({
  id,
  source: 'jamendo',
  slug: `track-jamendo-${id}`,
  title: `Track ${id}`,
  artistId: 'jamendo:1',
  artistName: 'Artist',
  artistSlug: 'artist-jamendo-1',
  albumId: null,
  albumTitle: null,
  albumSlug: null,
  coverUrl: '',
  streamUrl,
  duration: 100,
  releaseDate: '2024-01-01',
  genres: [],
  licenseUrl: null,
  licenseLabel: 'CC BY',
  plays: 0,
  likes: 0,
  mood: null,
  shareUrl: '',
})

describe('the sound of the player', () => {
  beforeEach(() => {
    sounds.length = 0
  })

  afterEach(() => {
    unload()
  })

  it('keeps only a few tracks that are loaded ahead of time', () => {
    for (let index = 0; index < 6; index += 1) {
      preloadTrack(makeTrack(String(index), `https://stream.test/${index}.mp3`))
    }

    expect(sounds).toHaveLength(6)
    expect(sounds.filter((sound) => sound.unloaded)).toHaveLength(3)
  })

  it('does not load the same track ahead of time twice', () => {
    preloadTrack(makeTrack('1', 'https://stream.test/1.mp3'))
    preloadTrack(makeTrack('1', 'https://stream.test/1.mp3'))

    expect(sounds).toHaveLength(1)
  })

  it('uses a track that was loaded ahead of time', () => {
    preloadTrack(makeTrack('1', 'https://stream.test/1.mp3'))
    expect(sounds).toHaveLength(1)

    loadTrack(makeTrack('1', 'https://stream.test/1.mp3'), {})

    expect(sounds).toHaveLength(1)
    expect(sounds[0].unloaded).toBe(false)
  })

  it('tells the length of a track that is ready already', () => {
    preloadTrack(makeTrack('1', 'https://stream.test/1.mp3'))
    sounds[0].durationValue = 42

    const onDuration = vi.fn()
    loadTrack(makeTrack('1', 'https://stream.test/1.mp3'), { onDuration })

    expect(onDuration).toHaveBeenCalledWith(42)
  })

  it('answers with the events of the sound', () => {
    const onPlay = vi.fn()
    const onEnd = vi.fn()

    loadTrack(makeTrack('1', 'https://stream.test/1.mp3'), { onPlay, onEnd })

    const sound = sounds[0]
    sound.handlers.play?.()
    sound.handlers.end?.()

    expect(onPlay).toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalled()
  })

  it('lets go of the tracks that were loaded ahead of time', () => {
    preloadTrack(makeTrack('1', 'https://stream.test/1.mp3'))
    preloadTrack(makeTrack('2', 'https://stream.test/2.mp3'))

    unload()

    expect(sounds.every((sound) => sound.unloaded)).toBe(true)
  })

  it('tells that a track without a link cannot be played', () => {
    const onError = vi.fn()

    loadTrack(makeTrack('1', ''), { onError })

    expect(onError).toHaveBeenCalled()
    expect(sounds).toHaveLength(0)
  })
})
