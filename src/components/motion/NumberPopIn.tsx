import { useState } from 'react'

interface NumberPopInProps {
  value: string
  className?: string
}

interface Digits {
  same: number
  from: string
}

export const NumberPopIn = ({ value, className }: NumberPopInProps) => {
  const [previous, setPrevious] = useState(value)
  const [digits, setDigits] = useState<Digits>({ same: value.length, from: value })
  const [run, setRun] = useState(0)

  // The comparison happens during the render so the browser never paints a
  // frame with stale digits, and the key remounts the group so the CSS
  // animation restarts from the first keyframe.
  if (previous !== value) {
    let same = 0
    while (same < previous.length && same < value.length && previous[same] === value[same]) {
      same += 1
    }

    setPrevious(value)
    setDigits({ same, from: previous })
    setRun((counter) => counter + 1)
  }

  const { same, from } = digits
  const changed = from !== value

  return (
    <span
      key={run}
      className={`t-digit-group${changed ? ' is-animating' : ''}${className ? ` ${className}` : ''}`}
    >
      {value.split('').map((character, index) => {
        if (index < same || !/\d/.test(character)) {
          return (
            <span key={index} className="t-digit" data-same="">
              {character}
            </span>
          )
        }

        const fromEnd = value.length - 1 - index
        const stagger = fromEnd === 1 ? '1' : fromEnd === 0 ? '2' : undefined
        const old = from[from.length - (value.length - index)]

        return (
          <span key={index} className="t-digit-slot" data-stagger={stagger}>
            {old && /\d/.test(old) && (
              <span className="t-digit-old" aria-hidden="true">
                {old}
              </span>
            )}
            <span className="t-digit">{character}</span>
          </span>
        )
      })}
    </span>
  )
}
