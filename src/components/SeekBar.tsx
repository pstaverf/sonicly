import { forwardRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface SeekBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  className?: string
  label?: string
}

const STEP = 5

/**
 * The bar is a real control: it can be moved with the mouse, with the touch
 * and with the keyboard, and it tells the screen reader where the track
 * stands.
 */
export const SeekBar = forwardRef<HTMLDivElement, SeekBarProps>(
  ({ currentTime, duration, onSeek, className, label }, ref) => {
  const { t } = useTranslation()

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  const seekToRatio = useCallback(
    (clientX: number, element: HTMLElement) => {
      const bounds = element.getBoundingClientRect()
      if (bounds.width <= 0) return

      const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width))
      onSeek(ratio * duration)
    },
    [duration, onSeek],
  )

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    seekToRatio(event.clientX, event.currentTarget)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onSeek(Math.max(0, currentTime - STEP))
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onSeek(Math.min(duration, currentTime + STEP))
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      onSeek(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      onSeek(duration)
    }
  }

  return (
    <div
      ref={ref}
      className={className ?? 'h-1.5 cursor-pointer rounded-full bg-white/10'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="slider"
      tabIndex={0}
      aria-label={label ?? t('player.progress')}
      aria-valuenow={Math.round(currentTime)}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(duration))}
      aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
    >
      <div className="h-full bg-accent transition-spring" style={{ width: `${progress}%` }} />
    </div>
  )
  },
)

SeekBar.displayName = 'SeekBar'

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`
}
