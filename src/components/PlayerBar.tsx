import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { playerInstance, setupMediaSession } from '../lib/player'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

export const PlayerBar = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    shuffle,
    repeat,
    currentTime,
    duration,
    setVolume,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    setCurrentTime,
    setTrack,
    addLike,
    removeLike,
  } = useStore()
  const { vibrate, patterns } = useHaptics()
  const location = useLocation()

  useEffect(() => {
    if (currentTrack) {
      playerInstance.src([currentTrack.audioUrl])
      setupMediaSession(currentTrack)
      if (isPlaying) playerInstance.play()
      else playerInstance.pause()
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    playerInstance.volume(volume / 100)
  }, [volume])

  const handlePlayPause = () => {
    vibrate(patterns.medium)
    togglePlay()
  }

  const handleLike = () => {
    if (!currentTrack) return
    vibrate(patterns.medium)
    if (currentTrack.likes > 0) removeLike(currentTrack.id)
    else addLike(currentTrack)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextTrack()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        prevTrack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, nextTrack, prevTrack])

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 transition-spring">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Track info */}
        <div className="flex items-center gap-4 w-1/3">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-12 h-12 rounded-lg object-cover shadow-lg" />
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">{currentTrack.title}</span>
            <span className="text-xs text-gray-400 truncate">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 w-1/3 justify-center">
          <button onClick={prevTrack} className="text-gray-300 hover:text-accent transition-spring" aria-label="Предыдущий">
            ◀
          </button>
          <button onClick={handlePlayPause} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center transition-spring" aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={nextTrack} className="text-gray-300 hover:text-accent transition-spring" aria-label="Следующий">
            ▶
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 w-1/3 justify-end">
          <button onClick={toggleShuffle} className={shuffle ? 'text-accent' : 'text-gray-300'} aria-label="Случайный порядок">
            ⇄
          </button>
          <button onClick={toggleRepeat} className={repeat !== 'none' ? 'text-accent' : 'text-gray-300'} aria-label="Повтор">
            ↻
          </button>
          <button onClick={handleLike} className={currentTrack.likes > 0 ? 'text-accent' : 'text-gray-300'} aria-label="Нравится">
            ♥
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-24 accent-accent"
            />
          </div>
        </div>
      </div>
      {/* Progress */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-accent transition-spring"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  )
}
