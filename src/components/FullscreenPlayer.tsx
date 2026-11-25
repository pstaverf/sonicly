import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { getCurrentTime, loadTrack, seek, setVolume as setPlayerVolume } from '../lib/player'
import { formatDuration } from '../lib/format'

import { IconSwap } from './motion/IconSwap'

export const FullscreenPlayer = () => {
  const { t } = useTranslation()
  const { vibrate, patterns } = useHaptics()

  const isFullscreen = useStore((state) => state.isFullscreen)
  const setFullscreen = useStore((state) => state.setFullscreen)
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

  const nextTrack = useStore((state) => state.nextTrack)
  const previousTrack = useStore((state) => state.previousTrack)
  const toggleShuffle = useStore((state) => state.toggleShuffle)
  const cycleRepeat = useStore((state) => state.cycleRepeat)
  const toggleMute = useStore((state) => state.toggleMute)
  const setVolume = useStore((state) => state.setVolume)
  const setCurrentTime = useStore((state) => state.setCurrentTime)

  const [dragging, setDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, setFullscreen])

  useEffect(() => {
    if (!isFullscreen) return
    const timer = window.setInterval(() => {
      if (!dragging && useStore.getState().isPlaying) setCurrentTime(getCurrentTime())
    }, 500)
    return () => window.clearInterval(timer)
  }, [isFullscreen, dragging, setCurrentTime])

  useEffect(() => {
    setPlayerVolume(muted ? 0 : volume / 100)
  }, [volume, muted])

  if (!isFullscreen || !currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left) / bounds.width
    const time = ratio * duration
    seek(time)
    setCurrentTime(time)
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-background/95 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="rounded-xl px-3 py-2 text-sm text-muted transition-spring hover:text-text"
            aria-label={t('common.back')}
            title={t('player.closeFullscreen')}
          >
            ↓
          </button>
          <span className="text-xs uppercase tracking-wider text-muted">{t('player.queue')}</span>
          <span className="text-sm text-muted tabular-nums">{queue.length}</span>
        </div>

        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="mx-auto aspect-square w-full max-w-sm rounded-3xl object-cover shadow-2xl"
          width={640}
          height={640}
        />

        <div>
          <h1 className="text-2xl font-bold text-balance">{currentTrack.title}</h1>
          <p className="mt-1 text-muted">{currentTrack.artistName}</p>
          {currentTrack.albumTitle && (
            <p className="text-sm text-muted">{currentTrack.albumTitle}</p>
          )}
        </div>

        <div
          ref={barRef}
          className="h-1.5 cursor-pointer rounded-full bg-white/10"
          onClick={handleSeek}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          role="progressbar"
          aria-label={t('player.progress')}
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-spring"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted tabular-nums">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              vibrate(patterns.light)
              toggleShuffle()
            }}
            className={`rounded-lg p-2 transition-spring ${shuffle ? 'text-accent' : 'text-muted'}`}
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
            onClick={() => {
              vibrate(patterns.medium)
              useStore.getState().togglePlay()
            }}
            className="flex size-16 items-center justify-center rounded-full bg-accent text-white shadow-xl transition-spring hover:scale-105"
            aria-label={isPlaying ? t('player.pause') : t('player.play')}
          >
            <IconSwap
              state={isPlaying ? 'b' : 'a'}
              iconA={<span className="text-xl">▶</span>}
              iconB={<span className="text-xl">⏸</span>}
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
            className={`rounded-lg p-2 transition-spring ${repeat !== 'off' ? 'text-accent' : 'text-muted'}`}
            aria-label={
              repeat === 'one'
                ? t('player.repeatOne')
                : repeat === 'all'
                  ? t('player.repeatAll')
                  : t('player.repeatOff')
            }
            aria-pressed={repeat !== 'off'}
          >
            {repeat === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        <div className="flex items-center gap-3">
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
            onChange={(event) => setVolume(Number(event.target.value))}
            className="flex-1 accent-accent"
            aria-label={t('player.volume')}
          />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t('player.queue')}
            </h2>
            {queue.length > 0 && (
              <button
                type="button"
                onClick={() => useStore.getState().clearQueue()}
                className="text-xs text-muted transition-spring hover:text-text"
              >
                {t('player.clearQueue')}
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <p className="text-sm text-muted">{t('player.emptyQueue')}</p>
          ) : (
            <ol className="space-y-1">
              {queue.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(index))
                    setDraggedIndex(index)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    if (draggedIndex === null || draggedIndex === index) return
                    useStore.getState().moveInQueue(draggedIndex, index)
                    setDraggedIndex(index)
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`group flex items-center gap-2 rounded-xl transition-spring ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <span
                    className="cursor-grab px-1 text-xs text-muted opacity-0 transition-spring group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    ⠿
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      useStore.getState().setTrack(item, queue)
                      useStore.getState().setPlaying(true)
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-spring hover:bg-white/5 ${
                      index === queueIndex ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums">{index + 1}</span>
                    <span className="truncate">{item.title}</span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums">
                      {formatDuration(item.duration)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => useStore.getState().removeFromQueue(index)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted opacity-0 transition-spring hover:text-text group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`${t('player.remove')}: ${item.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

export const preloadNext = (): void => {
  const { queue, queueIndex } = useStore.getState()
  const next = queue[queueIndex + 1]
  if (!next) return
  loadTrack(next, {})
}
