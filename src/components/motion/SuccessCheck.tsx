import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface SuccessCheckProps {
  trigger: number
  children?: ReactNode
  className?: string
}

export const SuccessCheck = ({ trigger, children, className }: SuccessCheckProps) => {
  const [state, setState] = useState<'out' | 'in'>('out')
  const [last, setLast] = useState(trigger)
  const ref = useRef<HTMLSpanElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  // A new trigger starts the check over, so it can be seen again.
  if (last !== trigger) {
    setLast(trigger)
    setState('out')
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (ref.current) void ref.current.offsetWidth
      setState('in')
    })

    return () => cancelAnimationFrame(frame)
  }, [trigger])

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    if (typeof path.getTotalLength !== 'function') return

    try {
      const length = Math.ceil(path.getTotalLength())
      path.style.strokeDasharray = String(length)
      path.style.strokeDashoffset = String(length)
    } catch {
      path.style.strokeDasharray = '20'
      path.style.strokeDashoffset = '20'
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
