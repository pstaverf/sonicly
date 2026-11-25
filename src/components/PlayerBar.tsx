import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import {
  getCurrentTime,
  loadTrack,
  pause,
  play,
  seek,
  setVolume,
  setupMediaSession,
} from '../lib/player'

import { CoverImage } from './CoverImage'

export const PlayerBar = () => {
  const { t } = useTranslation()
  const currentTrack = useStore((state) => state.currentTrack)
  const isPlaying = useStore((state) => state.isPlaying)
  const volume = useStore((state) => state.volume)
  const shuffle = useStore((state) => state.shuffle)
  const repeat = useStore((state) => state.repeat)
  const currentTime = useStore((state) => state.currentTime)
  const duration = useStore((state) => state.duration)
  const setVolumeState = useStore((state) => state.setVolume)
  const setCurrentTime = useStore((state) => state.setCurrentTime)
  const setDuration = useStore((state) => state.setDuration)
  const togglePlay = useStore((state) => state.togglePlay)
  const nextTrack = useStore((state) => state.nextTrack)
  const prevTrack = useStore((state) => state.prevTrack)
  const toggleShuffle = useStore((state) => state.toggleShuffle)
  const toggleRepeat = useStore((state) => state.toggleRepeat)
  const likedTracks = useStore((state) => state.likedTracks)
  const addLike = useStore((state) => state.addLike)
  const removeLike = useStore((state) => state.removeLike)

  const { vibrate, patterns } = useHaptics()
  const progressRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!currentTrack) return

    loadTrack(currentTrack, {
      onPlay: () => {
        if (!useStore.getState().isPlaying) useStore.setState({ isPlaying: true })
      },
      onPause: () => useStore.setState({ isPlaying: false }),
      onEnd: () => {
        const state = useStore.getState()
        if (state.repeat === 'one') {
          seek(0)
          play()
          return
        }
        if (state.repeat === 'all' || !state.currentTrack) {
          state.nextTrack()
          return
        }
        state.nextTrack()
      },
      onDuration: (value) => setDuration(value),
      onProgress: (value) => setCurrentTime(value),
      onError: () => useStore.setState({ isPlaying: false }),
    })

    setupMediaSession(currentTrack, {
      onPlay: () => useStore.setState({ isPlaying: true }),
      onPause: () => useStore.setState({ isPlaying: false }),
      onPrev: () => useStore.getState().prevTrack(),
      onNext: () => useStore.getState().nextTrack(),
    })
  }, [currentTrack, setCurrentTime, setDuration])

  useEffect(() => {
    if (isPlaying) play()
    else pause()
  }, [isPlaying])

  useEffect(() => {
    setVolume(volume / 100)
  }, [volume])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (useStore.getState().isPlaying) setCurrentTime(getCurrentTime())
    }, 500)

    return () => window.clearInterval(id)
  }, [setCurrentTime])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        nextTrack()
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        prevTrack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, nextTrack, prevTrack])

  if (!currentTrack) return null

  const isLiked = likedTracks.some((track) => track.id === currentTrack.id)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handlePlayPause = () => {
    vibrate(patterns.medium)
    togglePlay()
  }

  const handleLike = () => {
    vibrate(patterns.medium)
    if (isLiked) {
      removeLike(currentTrack.id)
      return
    }
    addLike(currentTrack)
    setToast(t('successAdded'))
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left) / bounds.width
    const time = ratio * duration
    seek(time)
    setCurrentTime(time)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 glass border-t border-white/10 z-50 transition-spring">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 rounded-xl glass border border-white/10 text-sm font-medium transition-reveal"
        >
          <span aria-hidden="true">✓ </span>
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <CoverImage
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="size-12 rounded-lg object-cover shadow-lg"
            width={192}
            height={192}
          />
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">{currentTrack.title}</span>
            <span className="text-xs text-gray-400 truncate">{currentTrack.artist}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 w-1/3 justify-center">
          <button
            onClick={prevTrack}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label={t('player.prev')}
          >
            ◀
          </button>
          <button
            onClick={handlePlayPause}
            className="size-10 rounded-full bg-accent text-white flex items-center justify-center transition-spring"
            aria-label={isPlaying ? t('player.pause') : t('player.play')}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={nextTrack}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label={t('player.next')}
          >
            ▶
          </button>
        </div>

        <div className="flex items-center gap-4 w-1/3 justify-end">
          <button
            onClick={toggleShuffle}
            className={shuffle ? 'text-accent' : 'text-gray-300'}
            aria-label={t('player.shuffle')}
            aria-pressed={shuffle}
          >
            ⇄
          </button>
          <button
            onClick={toggleRepeat}
            className={repeat !== 'none' ? 'text-accent' : 'text-gray-300'}
            aria-label={t('player.repeat')}
            aria-pressed={repeat !== 'none'}
          >
            ↻
          </button>
          <button
            onClick={handleLike}
            className={isLiked ? 'text-accent' : 'text-gray-300'}
            aria-label={t('player.like')}
            aria-pressed={isLiked}
          >
            ♥
          </button>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-xs">
              🔊
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => setVolumeState(Number(event.target.value))}
              className="w-24 accent-accent"
              aria-label={t('player.volume')}
            />
          </div>
        </div>
      </div>

      <div
        ref={progressRef}
        className="absolute bottom-0 inset-x-0 h-1 bg-gray-800 cursor-pointer"
        onClick={handleSeek}
        role="progressbar"
        aria-label={t('player.progress')}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-accent transition-spring" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
