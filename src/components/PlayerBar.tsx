import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { i18n } from '../i18n'
import { readCurrentTrack, saveCurrentTrack, useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import {
  getCurrentTime,
  loadTrack,
  pause,
  play,
  preloadTrack,
  seek,
  setVolume as setPlayerVolume,
  setupMediaSession,
} from '../lib/player'
import { formatDuration } from '../lib/format'

import { IconSwap } from './motion/IconSwap'
import { LikeButton } from './motion/LikeButton'
import { SeekBar } from './SeekBar'
import { SubtleNumber } from './motion/SubtleNumber'
import { SuccessCheck } from './motion/SuccessCheck'
import { NotificationBadge } from './motion/NotificationBadge'

export const PlayerBar = () => {
  const { t } = useTranslation()
  const { vibrate, patterns } = useHaptics()

  const currentTrack = useStore((state) => state.currentTrack)
  const isPlaying = useStore((state) => state.isPlaying)
  const volume = useStore((state) => state.volume)
  const muted = useStore((state) => state.muted)
  const shuffle = useStore((state) => state.shuffle)
  const repeat = useStore((state) => state.repeat)
  const currentTime = useStore((state) => state.currentTime)
  const duration = useStore((state) => state.duration)
  const queue = useStore((state) => state.queue)
  const queueIndex = useStore((state) => state.queueIndex)

  const setVolumeState = useStore((state) => state.setVolume)
  const setCurrentTime = useStore((state) => state.setCurrentTime)
  const setDuration = useStore((state) => state.setDuration)
  const togglePlay = useStore((state) => state.togglePlay)
  const nextTrack = useStore((state) => state.nextTrack)
  const previousTrack = useStore((state) => state.previousTrack)
  const toggleShuffle = useStore((state) => state.toggleShuffle)
  const cycleRepeat = useStore((state) => state.cycleRepeat)
  const toggleMute = useStore((state) => state.toggleMute)
  const setFullscreen = useStore((state) => state.setFullscreen)
  const likedTracks = useStore((state) => state.likedTracks)
  const toggleLike = useStore((state) => state.toggleLike)
  const pushHistory = useStore((state) => state.pushHistory)

  const [toast, setToast] = useState<string | null>(null)
  const [toastTrigger, setToastTrigger] = useState(0)
  const restored = useRef(false)

  const isLiked = currentTrack ? likedTracks.some((item) => item.id === currentTrack.id) : false

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

        state.nextTrack()
      },
      onDuration: (value) => setDuration(value),
      onProgress: (value) => setCurrentTime(value),
      onError: () => {
        useStore.setState({ isPlaying: false })
        setToast(i18n.t('player.unavailable'))
        setToastTrigger((value) => value + 1)
        useStore.getState().nextTrack()
      },
    })

    setupMediaSession(currentTrack, {
      onPlay: () => useStore.setState({ isPlaying: true }),
      onPause: () => useStore.setState({ isPlaying: false }),
      onPrev: () => useStore.getState().previousTrack(),
      onNext: () => useStore.getState().nextTrack(),
    })

    pushHistory(currentTrack)
  }, [currentTrack, setCurrentTime, setDuration, pushHistory])

  useEffect(() => {
    if (isPlaying) play()
    else pause()
  }, [isPlaying])

  // The track that plays is written down, so it stands in the player after a
  // reload. It is brought back after the page was built, otherwise the
  // markup of the server and the markup of the browser would differ.
  useEffect(() => {
    // The track of the last visit is brought back first, otherwise it would
    // be written away before it was read.
    if (!restored.current) {
      restored.current = true

      const saved = readCurrentTrack()
      const state = useStore.getState()

      if (saved && !state.currentTrack) {
        const index = state.queue.findIndex((item) => item.id === saved.id)

        useStore.setState({
          currentTrack: saved,
          queueIndex: index >= 0 ? index : state.queueIndex,
          duration: saved.duration,
        })
      }

      return
    }

    saveCurrentTrack(currentTrack)
  }, [currentTrack])

  useEffect(() => {
    setPlayerVolume(muted ? 0 : volume / 100)
  }, [volume, muted])

  useEffect(() => {
    const next = queue[queueIndex + 1]
    if (next) preloadTrack(next)
  }, [queue, queueIndex])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (useStore.getState().isPlaying) setCurrentTime(getCurrentTime())
    }, 500)

    return () => window.clearInterval(timer)
  }, [setCurrentTime])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      } else if (event.code === 'ArrowRight' && event.altKey) {
        event.preventDefault()
        nextTrack()
      } else if (event.code === 'ArrowLeft' && event.altKey) {
        event.preventDefault()
        previousTrack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, nextTrack, previousTrack])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!currentTrack) return null

  const handlePlayPause = () => {
    vibrate(patterns.medium)
    togglePlay()
  }

  const handleLike = () => {
    vibrate(patterns.medium)
    toggleLike(currentTrack)
    setToast(isLiked ? t('toast.unliked') : t('toast.liked'))
    setToastTrigger((value) => value + 1)
  }

  const handleSeek = (time: number) => {
    const target = Math.min(duration, Math.max(0, time))
    seek(target)
    setCurrentTime(target)
  }

  return (
    <div className="glass fixed inset-x-0 bottom-0 z-50 border-t border-white/10 md:pl-(--sidebar-width)">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass transition-reveal absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        >
          <SuccessCheck trigger={toastTrigger} />
          {toast}
        </div>
      )}

      <div className="mx-auto flex h-(--player-height) max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="size-11 shrink-0 rounded-lg object-cover shadow-lg"
            loading="lazy"
            decoding="async"
            width={176}
            height={176}
          />
          <div className="min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{currentTrack.title}</span>
            <span className="truncate text-xs text-muted">{currentTrack.artistName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              vibrate(patterns.light)
              toggleShuffle()
            }}
            className={`hidden rounded-lg p-2 transition-spring sm:block ${shuffle ? 'text-accent' : 'text-muted'}`}
            aria-label={t('player.shuffle')}
            aria-pressed={shuffle}
          >
            ⇄
          </button>

          <button
            type="button"
            onClick={previousTrack}
            className="rounded-lg p-2 text-muted transition-spring hover:text-text"
            aria-label={t('player.prev')}
          >
            ◀◀
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-spring hover:scale-105"
            aria-label={isPlaying ? t('player.pause') : t('player.play')}
          >
            <IconSwap
              state={isPlaying ? 'b' : 'a'}
              iconA={<span className="text-base">▶</span>}
              iconB={<span className="text-base">⏸</span>}
            />
          </button>

          <button
            type="button"
            onClick={nextTrack}
            className="rounded-lg p-2 text-muted transition-spring hover:text-text"
            aria-label={t('player.next')}
          >
            ▶▶
          </button>

          <button
            type="button"
            onClick={() => {
              vibrate(patterns.light)
              cycleRepeat()
            }}
            className={`hidden rounded-lg p-2 transition-spring sm:block ${repeat !== 'off' ? 'text-accent' : 'text-muted'}`}
            aria-label={t('player.repeat')}
            title={
              repeat === 'one'
                ? t('player.repeatOne')
                : repeat === 'all'
                  ? t('player.repeatAll')
                  : t('player.repeatOff')
            }
            aria-pressed={repeat !== 'off'}
          >
            <IconSwap
              state={repeat === 'one' ? 'b' : 'a'}
              iconA={<span aria-hidden="true">🔁</span>}
              iconB={<span aria-hidden="true">🔂</span>}
            />
          </button>
        </div>

        {/* The heart has to be within reach on a phone as well, so it stands
            outside of the column that is hidden on a narrow screen. */}
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-3">
          <LikeButton
            liked={isLiked}
            onToggle={handleLike}
            label={isLiked ? t('player.unlike') : t('player.like')}
            className={`rounded-lg p-2 transition-spring ${isLiked ? 'text-accent' : 'text-muted'}`}
          />

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-lg p-2 text-muted transition-spring hover:text-text"
              aria-label={muted ? t('player.unmute') : t('player.mute')}
            >
              <IconSwap
                state={muted ? 'b' : 'a'}
                iconA={<span aria-hidden="true">🔊</span>}
                iconB={<span aria-hidden="true">🔇</span>}
              />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={muted ? 0 : volume}
              onChange={(event) => setVolumeState(Number(event.target.value))}
              className="w-24 accent-accent"
              aria-label={t('player.volume')}
            />
          </div>

          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="rounded-lg p-2 text-muted transition-spring hover:text-text"
            aria-label={t('player.fullscreen')}
          >
            ⤢
          </button>
        </div>
      </div>

      <SeekBar
        className="absolute inset-x-0 bottom-0 h-1 cursor-pointer bg-white/10"
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      <div className="sr-only" aria-live="polite">
        <SubtleNumber value={formatDuration(currentTime)} /> / {formatDuration(duration)}
      </div>
    </div>
  )
}

export const PlayerBadge = () => {
  const likedTracks = useStore((state) => state.likedTracks)
  return <NotificationBadge count={likedTracks.length} />
}
