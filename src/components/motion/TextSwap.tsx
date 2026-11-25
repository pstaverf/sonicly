import { useEffect, useRef, useState } from 'react'

import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'

interface TextSwapProps {
  text: string
  className?: string
}

interface SwapState {
  shown: string
  exiting: boolean
}

const readMs = (name: string, fallback: number): number => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback

  const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
  const value = parseFloat(raw)

  return Number.isFinite(value) ? value : fallback
}

export const TextSwap = ({ text, className }: TextSwapProps) => {
  const [state, setState] = useState<SwapState>({ shown: text, exiting: false })
  const nodeRef = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  // The old text leaves upwards as soon as a new text is asked for.
  if (state.shown !== text && !state.exiting) {
    setState((current) => ({ ...current, exiting: true }))
  }

  useEffect(() => {
    if (!state.exiting) return

    const duration = readMs('--text-swap-dur', 150)

    const timer = window.setTimeout(() => {
      setState({ shown: text, exiting: false })
    }, duration)

    return () => window.clearTimeout(timer)
  }, [state.exiting, text])

  // The new text waits below its place and travels up to it.
  useIsomorphicLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }

    const node = nodeRef.current
    if (!node) return

    node.classList.add('is-enter-start')
    void node.offsetWidth
    node.classList.remove('is-enter-start')
  }, [state.shown])

  const classNames = ['t-text-swap', state.exiting ? 'is-exit' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={nodeRef} className={classNames}>
      {state.shown}
    </span>
  )
}
