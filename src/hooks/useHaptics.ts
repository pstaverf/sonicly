import { useCallback, useMemo } from 'react'

import { useStore } from '../store'

const isSupported = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export const useHaptics = () => {
  const enabled = useStore((state) => state.hapticsEnabled)
  const supported = useMemo(() => isSupported(), [])

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!enabled || !supported) return
      navigator.vibrate(pattern)
    },
    [enabled, supported],
  )

  const patterns = useMemo(
    () => ({
      light: 10,
      medium: 30,
      success: [10, 30, 10],
      error: [50, 30, 50, 30, 50],
    }),
    [],
  )

  return { vibrate, patterns, supported, enabled }
}
