import { cloneElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'

type ShakeableProps = {
  className?: string
}

interface InputShakeProps {
  error: boolean
  message?: ReactNode
  /** A new number replays the shake, also when the error stands. */
  trigger?: number
  /** Called when the shake is over, so the owner can drop the error. */
  onReset?: () => void
  children: ReactElement<ShakeableProps>
}

interface ShakeState {
  trigger: number
  error: boolean
  /** The error was read and the field returns to its calm state. */
  dismissed: boolean
}

const readMs = (name: string, fallback: number): number => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback

  const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
  const value = parseFloat(raw)

  return Number.isFinite(value) ? value : fallback
}

export const InputShake = ({
  error,
  message,
  trigger = 0,
  onReset,
  children,
}: InputShakeProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const shakeTimer = useRef<number | null>(null)
  const revertTimer = useRef<number | null>(null)
  const onResetRef = useRef(onReset)
  const [state, setState] = useState<ShakeState>({ trigger, error, dismissed: false })

  useEffect(() => {
    onResetRef.current = onReset
  })

  // A new error or a new shake starts a new round, the old one is over.
  if (state.trigger !== trigger || state.error !== error) {
    setState({ trigger, error, dismissed: false })
  }

  const shown = error && !state.dismissed

  const clearTimers = useCallback(() => {
    if (shakeTimer.current !== null) {
      window.clearTimeout(shakeTimer.current)
      shakeTimer.current = null
    }
    if (revertTimer.current !== null) {
      window.clearTimeout(revertTimer.current)
      revertTimer.current = null
    }
  }, [])

  const inputNode = useCallback((): HTMLElement | null => {
    const wrap = wrapRef.current
    if (!wrap) return null

    return wrap.querySelector<HTMLElement>('.t-input')
  }, [])

  const stopShake = useCallback(() => {
    inputNode()?.classList.remove('is-shaking')
  }, [inputNode])

  useEffect(() => {
    if (!error) {
      clearTimers()
      stopShake()
      return
    }

    const shakeMs = readMs('--shake-dur-a', 80) * 2 + readMs('--shake-dur-b', 60) * 2

    shakeTimer.current = window.setTimeout(() => {
      shakeTimer.current = null
      stopShake()
    }, shakeMs + 20)

    // The border and the message return to their calm state after the hold,
    // so the visitor has the time to read what went wrong.
    const hold = readMs('--revert-hold', 3000)

    revertTimer.current = window.setTimeout(() => {
      revertTimer.current = null
      setState((current) => ({ ...current, dismissed: true }))
      stopShake()
      onResetRef.current?.()
    }, shakeMs + hold)

    return clearTimers
  }, [error, trigger, clearTimers, stopShake])

  // The class of the shake is written after the browser took the new class
  // of the field, so the motion starts from a clean baseline and can be
  // replayed as often as the error comes.
  useIsomorphicLayoutEffect(() => {
    if (!error) return

    const node = inputNode()
    if (!node) return

    node.classList.remove('is-shaking')
    void node.offsetWidth
    node.classList.add('is-shaking')
  }, [error, trigger, inputNode])

  // A value that is being corrected does not need the error any more.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const field = wrap.querySelector<HTMLElement>('.t-input')
    if (!field) return

    const handleInput = () => {
      clearTimers()
      stopShake()
      setState((current) => ({ ...current, dismissed: true }))
      onResetRef.current?.()
    }

    field.addEventListener('input', handleInput)

    return () => field.removeEventListener('input', handleInput)
  }, [clearTimers, stopShake])

  const className = [children.props.className ?? '', 't-input', shown ? 'is-error' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={wrapRef} className={`t-input-wrap${shown ? ' is-error' : ''}`}>
      {cloneElement(children, { className })}
      <p className="t-error-msg" role="alert">
        {message}
      </p>
    </div>
  )
}
