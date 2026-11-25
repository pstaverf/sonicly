import { Howl } from 'howler'

import type { Track } from '../types'

declare module 'howler' {
  interface Howl {
    src(src: string | string[]): number | number[]
  }
}

let howl: Howl | null = null

const activeTrackId: { current: string | null } = { current: null }

const ensureHowl = (src: string[]) => {
  if (!howl) {
    howl = new Howl({ src, format: ['mp3', 'wav'], html5: true, preload: true })
  }
  return howl
}

export const loadTrack = (
  track: Track,
  handlers: {
    onPlay: () => void
    onPause: () => void
    onEnd: () => void
    onDuration: (duration: number) => void
    onProgress: (time: number) => void
    onError: () => void
  },
) => {
  if (activeTrackId.current === track.id && howl) return howl

  if (howl) {
    howl.unload()
    howl = null
  }

  const instance = ensureHowl([track.audioUrl])

  instance.once('load', () => {
    handlers.onDuration(instance.duration())
  })
  instance.on('play', handlers.onPlay)
  instance.on('pause', handlers.onPause)
  instance.on('end', handlers.onEnd)
  instance.on('loaderror', handlers.onError)
  instance.on('playerror', handlers.onError)

  activeTrackId.current = track.id

  return instance
}

export const getHowl = () => howl

export const play = () => {
  if (!howl) return
  if (howl.state() === 'loaded') howl.play()
  else howl.once('load', () => howl?.play())
}

export const pause = () => {
  howl?.pause()
}

export const stop = () => {
  howl?.stop()
}

export const setVolume = (volume: number) => {
  howl?.volume(volume)
}

export const getCurrentTime = () => howl?.seek() ?? 0

export const seek = (time: number) => {
  howl?.seek(time)
}

export const setupMediaSession = (track: Track, handlers: {
  onPlay: () => void
  onPause: () => void
  onPrev: () => void
  onNext: () => void
}) => {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: [{ src: track.coverUrl, sizes: '512x512', type: 'image/png' }],
  })

  navigator.mediaSession.setActionHandler('play', handlers.onPlay)
  navigator.mediaSession.setActionHandler('pause', handlers.onPause)
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev)
  navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext)
}
