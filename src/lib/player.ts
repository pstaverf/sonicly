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
    current?.unload()
    current = new Howl({
      src: [track.streamUrl],
      html5: true,
      preload: true,
      volume: 0,
      onplay: () => handlers.onPlay?.(),
      onpause: () => handlers.onPause?.(),
      onstop: () => handlers.onPause?.(),
      onend: () => handlers.onEnd?.(),
      onload: () => handlers.onDuration?.(current?.duration() ?? 0),
      onplayerror: () => handlers.onError?.(),
      onloaderror: () => handlers.onError?.(),
    })
    currentUrl = track.streamUrl
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
  new Howl({ src: [track.streamUrl], html5: true, preload: true, volume: 0 })
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
