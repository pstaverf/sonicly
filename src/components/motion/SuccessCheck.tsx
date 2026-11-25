import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface SuccessCheckProps {
  trigger: number
  children?: ReactNode
  className?: string
}

export const SuccessCheck = ({ trigger, children, className }: SuccessCheckProps) => {
  const [state, setState] = useState<'out' | 'in'>('out')
  const ref = useRef<HTMLSpanElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }

    setState('out')
    const frame = requestAnimationFrame(() => {
      if (ref.current) void ref.current.offsetWidth
      setState('in')
    })

    return () => cancelAnimationFrame(frame)
  }, [trigger])

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    // Not every engine knows the length of the path, the check simply plays
    // without the drawing effect then.
    if (typeof path.getTotalLength !== 'function') return

    try {
      const length = path.getTotalLength()
      path.style.strokeDasharray = String(length)
      path.style.strokeDashoffset = String(length)
    } catch {
      // the check stays as it is
    }
  }, [])

  return (
    <span
      ref={ref}
      className={`t-success-check${className ? ` ${className}` : ''}`}
      data-state={state}
      aria-hidden="true"
    >
      {children ?? (
        <svg viewBox="0 0 48 48" width={20} height={20} fill="none">
          <path
            ref={pathRef}
            d="M12 25.5 L20.5 34 L36 15"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
