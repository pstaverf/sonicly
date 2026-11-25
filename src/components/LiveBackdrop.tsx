import { useEffect } from 'react'

import { useStore } from '../store'
import { useDominantColor } from '../hooks/useDominantColor'

export const LiveBackdrop = () => {
  const currentTrack = useStore((state) => state.currentTrack)

  const accent = useDominantColor(currentTrack?.coverUrl, currentTrack?.id ?? 'sonicly')
  const secondary = useDominantColor(
    currentTrack?.albumTitle ? `${currentTrack.albumTitle}-${currentTrack.id}` : undefined,
    `${currentTrack?.id ?? 'sonicly'}-secondary`,
  )

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--live-accent', accent)
    root.style.setProperty('--live-accent-2', secondary)
  }, [accent, secondary])

  return <div className="live-backdrop" aria-hidden="true" />
}
