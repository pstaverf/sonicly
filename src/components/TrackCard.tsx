import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import type { Track } from '../types'
import { formatCount, formatDuration } from '../lib/format'
import { useHaptics } from '../hooks/useHaptics'
import { usePrefetchTrack } from '../api'
import { useStore } from '../store'

import { IconSwap } from './motion/IconSwap'
import { NumberPopIn } from './motion/NumberPopIn'
import { PlaylistPicker } from './PlaylistPicker'

interface TrackCardProps {
  track: Track
  queue?: Track[]
  index?: number
  onPrefetch?: (track: Track) => void
  variant?: 'grid' | 'list'
  playlistActions?: boolean
}

export const TrackCard = ({
  track,
  queue,
  index,
  onPrefetch,
  variant = 'grid',
  playlistActions = false,
}: TrackCardProps) => {
  const { t } = useTranslation()
  const { vibrate, patterns } = useHaptics()
  const currentTrack = useStore((state) => state.currentTrack)
  const isPlaying = useStore((state) => state.isPlaying)
  const setTrack = useStore((state) => state.setTrack)
  const setPlaying = useStore((state) => state.setPlaying)
  const playNext = useStore((state) => state.playNext)
  const addToQueue = useStore((state) => state.addToQueue)
  const prefetch = usePrefetchTrack()

  const isCurrent = currentTrack?.id === track.id
  const handlePrefetch = () => {
    prefetch(track)
    onPrefetch?.(track)
  }

  const handlePlay = () => {
    vibrate(patterns.medium)
    if (isCurrent) {
      setPlaying(!isPlaying)
      return
    }
    setTrack(track, queue)
    setPlaying(true)
  }

  const handlePlayNext = () => {
    vibrate(patterns.light)
    playNext(track)
  }

  const handleAddToQueue = () => {
    vibrate(patterns.light)
    addToQueue(track)
  }

  // The list variant wraps the cover in a button, so the cover itself must not
  // carry a second one: a button inside a button is invalid markup.
  const cover = (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
      {track.coverUrl ? (
        <img
          src={track.coverUrl}
          alt={track.title}
          className="size-full object-cover transition-spring group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />
      ) : (
        <div
          className="flex size-full items-center justify-center bg-linear-to-br from-accent/30 to-accent/5 text-3xl"
          aria-hidden="true"
        >
          🎵
        </div>
      )}

      {variant === 'grid' && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-spring group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={isCurrent && isPlaying ? t('player.pause') : t('player.play')}
        >
          <IconSwap
            state={isCurrent && isPlaying ? 'b' : 'a'}
            iconA={<span className="text-2xl">▶</span>}
            iconB={<span className="text-2xl">⏸</span>}
            className="size-12 items-center justify-center rounded-full bg-white/95 text-black shadow-lg"
          />
        </button>
      )}
    </div>
  )

  const meta = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{track.title}</p>
      <p className="truncate text-xs text-muted">{track.artistName}</p>
    </div>
  )

  const stats = (
    <div className="flex items-center gap-3 text-xs text-muted tabular-nums">
      {track.plays > 0 && (
        <span aria-label={t('stats.plays')}>
          <NumberPopIn value={formatCount(track.plays)} />
        </span>
      )}
      <span>{formatDuration(track.duration)}</span>
    </div>
  )

  const sourceLabel = t(`source.${track.source}`)

  if (variant === 'list') {
    return (
      <div
        className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-spring hover:bg-white/5"
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
      >
        <span className="w-6 shrink-0 text-center text-xs text-muted tabular-nums">
          {index !== undefined ? index + 1 : '·'}
        </span>

        <button
          type="button"
          onClick={handlePlay}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`${t('player.playNow')}: ${track.title}`}
        >
          <span className="size-10 shrink-0 overflow-hidden rounded-lg">{cover}</span>
          {meta}
        </button>

        <span className="hidden shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] text-muted sm:inline">
          {sourceLabel}
        </span>

        {stats}

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-spring group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={handlePlayNext}
            className="rounded-lg p-1.5 text-muted transition-spring hover:text-text"
            aria-label={`${t('player.playNext')}: ${track.title}`}
          >
            ⤼
          </button>
          <button
            type="button"
            onClick={handleAddToQueue}
            className="rounded-lg p-1.5 text-muted transition-spring hover:text-text"
            aria-label={`${t('player.addToQueue')}: ${track.title}`}
          >
            ＋
          </button>
          {playlistActions && <PlaylistPicker track={track} />}
        </div>

        <Link
          to={`/track/${track.slug}`}
          className="shrink-0 text-xs text-muted transition-spring hover:text-accent"
          aria-label={`${t('track.details')}: ${track.title}`}
        >
          ℹ
        </Link>
      </div>
    )
  }

  return (
    <article
      className="group flex flex-col gap-3"
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
    >
      {cover}

      <div className="flex items-start justify-between gap-2">
        {meta}
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {formatDuration(track.duration)}
        </span>
      </div>
    </article>
  )
}
