import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Track } from '../types'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'

import { SuccessCheck } from './motion/SuccessCheck'

interface PlaylistPickerProps {
  track: Track
  className?: string
}

export const PlaylistPicker = ({ track, className }: PlaylistPickerProps) => {
  const { t } = useTranslation()
  const { vibrate, patterns } = useHaptics()
  const playlists = useStore((state) => state.playlists)
  const addToPlaylist = useStore((state) => state.addToPlaylist)
  const createPlaylist = useStore((state) => state.createPlaylist)

  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const [trigger, setTrigger] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = (playlistId: string) => {
    vibrate(patterns.success)
    addToPlaylist(playlistId, track)
    setOpen(false)
    setToast(true)
    setTrigger((value) => value + 1)
    window.setTimeout(() => setToast(false), 2200)
  }

  const handleCreate = () => {
    vibrate(patterns.success)
    const playlist = createPlaylist(track.title)
    addToPlaylist(playlist.id, track)
    setOpen(false)
    setToast(true)
    setTrigger((value) => value + 1)
    window.setTimeout(() => setToast(false), 2200)
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg px-2 py-1 text-xs text-muted transition-spring hover:text-text"
        aria-label={`${t('library.addToPlaylist')}: ${track.title}`}
        aria-expanded={open}
      >
        ＋
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-30 mt-1 min-w-48 rounded-xl p-1.5 shadow-2xl">
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">{t('library.emptyPlaylists')}</p>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={() => handleSelect(playlist.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-spring hover:bg-white/5"
              >
                <span className="truncate">{playlist.title}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {playlist.trackIds.length}
                </span>
              </button>
            ))
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-accent transition-spring hover:bg-white/5"
          >
            + {t('library.createPlaylist')}
          </button>
        </div>
      )}

      {toast && (
        <span
          role="status"
          className="glass absolute right-0 top-full z-30 mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
        >
          <SuccessCheck trigger={trigger} />
          {t('toast.added')}
        </span>
      )}
    </div>
  )
}
