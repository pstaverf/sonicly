import { Howl } from 'howler'

import type { Track } from '../types'

export interface PlayerHandlers {
  onPlay?: () => void
  onPause?: () => void
  onEnd?: () => void
  onDuration?: (duration: number) => void
  onProgress?: (time: number) => void
  onError?: () => void
}

let current: Howl | null = null
let currentUrl = ''
let loadedTrackId = ''

/**
 * The tracks that are loaded ahead of time. Only a few of them are kept, so
 * the memory of the browser does not grow with every row that is looked at.
 */
const PRELOAD_LIMIT = 3
const preloaded = new Map<string, Howl>()

const EVENTS = ['play', 'pause', 'stop', 'end', 'load', 'playerror', 'loaderror'] as const

const bind = (sound: Howl, handlers: PlayerHandlers): void => {
  for (const event of EVENTS) sound.off(event)

  sound.on('play', () => handlers.onPlay?.())
  sound.on('pause', () => handlers.onPause?.())
  sound.on('stop', () => handlers.onPause?.())
  sound.on('end', () => handlers.onEnd?.())
  sound.on('load', () => handlers.onDuration?.(sound.duration() ?? 0))
  sound.on('playerror', () => handlers.onError?.())
  sound.on('loaderror', () => handlers.onError?.())

  // A track that was loaded ahead of time is ready already, so the event of
  // the load does not come again.
  const duration = sound.duration()
  if (duration > 0) handlers.onDuration?.(duration)
}

export const loadTrack = (track: Track, handlers: PlayerHandlers): void => {
  if (!track.streamUrl) {
    handlers.onError?.()
    return
  }

  if (current && loadedTrackId === track.id) {
    current.unload()
    current = null
  }

  if (!current || currentUrl !== track.streamUrl) {
    // A track that was loaded ahead of time is used as it is, so the music
    // starts without a pause.
    const ready = preloaded.get(track.streamUrl)
    preloaded.delete(track.streamUrl)

    current?.unload()
    current =
      ready ??
      new Howl({
        src: [track.streamUrl],
        html5: true,
        preload: true,
        volume: 0,
      })
    currentUrl = track.streamUrl

    bind(current, handlers)
  }

  loadedTrackId = track.id
}

export const play = (): void => {
  current?.play()
}

export const pause = (): void => {
  current?.pause()
}

export const stop = (): void => {
  current?.stop()
}

export const unload = (): void => {
  current?.unload()
  current = null
  currentUrl = ''
  loadedTrackId = ''

  for (const sound of preloaded.values()) sound.unload()
  preloaded.clear()
}

export const seek = (time: number): void => {
  if (!current) return
  current.seek(time)
}

export const getCurrentTime = (): number => current?.seek() ?? 0

export const getDuration = (): number => current?.duration() ?? 0

export const setVolume = (value: number): void => {
  current?.volume(value)
}

export const isLoaded = (): boolean => current !== null

export const preloadTrack = (track: Track): void => {
  if (!track.streamUrl || loadedTrackId === track.id) return
  if (preloaded.has(track.streamUrl)) return

  preloaded.set(
    track.streamUrl,
    new Howl({ src: [track.streamUrl], html5: true, preload: true, volume: 0 }),
  )

  while (preloaded.size > PRELOAD_LIMIT) {
    const oldest = preloaded.keys().next().value
    if (oldest === undefined) break

    const sound = preloaded.get(oldest)
    preloaded.delete(oldest)
    sound?.unload()
  }
}

export const getCurrentTrackId = (): string => loadedTrackId

export interface MediaSessionHandlers {
  onPlay: () => void
  onPause: () => void
  onPrev: () => void
  onNext: () => void
}

export const setupMediaSession = (
  track: Track,
  handlers: MediaSessionHandlers,
): void => {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

  const session = navigator.mediaSession

  session.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artistName,
    album: track.albumTitle ?? 'Sonicly',
    artwork: track.coverUrl
      ? [
          { src: track.coverUrl, sizes: '480x480', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '1000x1000', type: 'image/jpeg' },
        ]
      : [],
  })

  session.setActionHandler('play', handlers.onPlay)
  session.setActionHandler('pause', handlers.onPause)
  session.setActionHandler('previoustrack', handlers.onPrev)
  session.setActionHandler('nexttrack', handlers.onNext)
}
