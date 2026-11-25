import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'

interface StaggerProps {
  children: ReactNode
  className?: string
}

interface StaggerItemProps {
  /** The row waits for the rows above it. */
  index: number
  children: ReactNode
  className?: string
}

export const Stagger = ({ children, className }: StaggerProps) => {
  const ref = useRef<HTMLDivElement>(null)

  // The lines wait below their place and travel up, one after the other.
  useIsomorphicLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    node.classList.remove('is-shown')
    void node.offsetHeight
    node.classList.add('is-shown')
  }, [])

  return (
    <div ref={ref} className={`t-stagger${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

export const StaggerItem = ({ index, children, className }: StaggerItemProps) => (
  <div
    className={`t-stagger-line${className ? ` ${className}` : ''}`}
    style={{ '--stagger-index': index } as CSSProperties}
  >
    {children}
  </div>
)
