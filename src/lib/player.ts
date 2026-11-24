import { Howl } from 'howler'
import { Track } from '../types'

// Global Howler instance outside routes
export const playerInstance = new Howl({
  src: [],
  format: ['mp3'],
  html5: true,
})

export const setupMediaSession = (track: Track) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: track.coverUrl, sizes: '512x512', type: 'image/png' }],
    })
    navigator.mediaSession.setActionHandler('play', () => { /* handle */ })
    navigator.mediaSession.setActionHandler('pause', () => { /* handle */ })
    navigator.mediaSession.setActionHandler('previoustrack', () => { /* handle */ })
    navigator.mediaSession.setActionHandler('nexttrack', () => { /* handle */ })
  }
}
