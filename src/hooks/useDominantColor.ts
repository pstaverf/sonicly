import { useEffect, useState } from 'react'

import { extractDominantColor, fallbackColor } from '../lib/color'

export const useDominantColor = (coverUrl: string | undefined, seed: string): string => {
  const fallback = fallbackColor(seed)
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    if (!coverUrl) return

    let cancelled = false

    void extractDominantColor(coverUrl, seed).then((value) => {
      if (!cancelled) setColor(value)
    })

    return () => {
      cancelled = true
    }
  }, [coverUrl, seed])

  return coverUrl ? color : fallback
}
