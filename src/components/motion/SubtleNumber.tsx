import { useState } from 'react'
import type { CSSProperties } from 'react'

interface SubtleNumberProps {
  value: string
  className?: string
}

interface Slot {
  character: string
  old?: string
  changed: boolean
}

interface NumberState {
  slots: Slot[]
  dir: 1 | -1
  run: number
}

const toNumber = (text: string): number => {
  const digits = text.replace(/\D/g, '')

  return digits.length > 0 ? Number(digits) : 0
}

const buildSlots = (from: string, to: string): Slot[] => {
  const sameLength = from.length === to.length

  return to.split('').map((character, index) => {
    const old = sameLength ? from[index] : undefined

    return { character, old, changed: !sameLength || old !== character }
  })
}

export const SubtleNumber = ({ value, className }: SubtleNumberProps) => {
  const [previous, setPrevious] = useState(value)
  const [state, setState] = useState<NumberState>(() => ({
    slots: buildSlots(value, value),
    dir: 1,
    run: 0,
  }))

  // The comparison happens during the render, so the browser never paints a
  // frame with the old number. The key remounts the number, so the motion
  // starts again with every change.
  if (previous !== value) {
    const dir = toNumber(value) >= toNumber(previous) ? 1 : -1

    setPrevious(value)
    setState((current) => ({
      slots: buildSlots(previous, value),
      dir,
      run: current.run + 1,
    }))
  }

  const changed = state.slots.some((slot) => slot.changed)

  return (
    <span
      key={state.run}
      className={`t-subtle-number${changed ? ' is-animating' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={{ '--subtle-dir': state.dir } as CSSProperties}
      aria-label={value}
    >
      {state.slots.map((slot, index) => {
        if (!slot.changed) {
          return slot.character
        }

        return (
          <span key={index} className="t-subtle-slot">
            {slot.old !== undefined && (
              <span className="t-subtle-old" aria-hidden="true">
                {slot.old}
              </span>
            )}
            <span className="t-subtle-new">{slot.character}</span>
          </span>
        )
      })}
    </span>
  )
}
