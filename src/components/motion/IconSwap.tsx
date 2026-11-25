import type { ReactNode } from 'react'

interface IconSwapProps {
  state: 'a' | 'b'
  iconA: ReactNode
  iconB: ReactNode
  className?: string
}

export const IconSwap = ({ state, iconA, iconB, className }: IconSwapProps) => (
  <span className={`t-icon-swap${className ? ` ${className}` : ''}`} data-state={state}>
    <span className="t-icon" data-icon="a">
      {iconA}
    </span>
    <span className="t-icon" data-icon="b">
      {iconB}
    </span>
  </span>
)
