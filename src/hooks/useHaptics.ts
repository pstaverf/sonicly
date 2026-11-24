import { useState, useEffect } from 'react'

export const useHaptics = () => {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('vibrate' in navigator)
  }, [])

  const vibrate = (pattern: number | number[]) => {
    if (supported) {
      navigator.vibrate(pattern)
    }
  }

  const patterns = {
    light: 10,
    medium: 30,
    success: [10, 30, 10],
    error: [50, 30, 50, 30, 50],
  }

  return { vibrate, patterns, supported }
}
