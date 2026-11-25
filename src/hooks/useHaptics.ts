import { useCallback, useMemo } from 'react'

const isSupported = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

export const useHaptics = () => {
  const supported = useMemo(() => isSupported(), [])

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (supported) {
        navigator.vibrate(pattern)
      }
    },
    [supported],
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

  return { vibrate, patterns, supported }
}
