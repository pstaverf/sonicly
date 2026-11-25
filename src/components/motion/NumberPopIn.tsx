import { useEffect, useRef, useState } from 'react'

interface NumberPopInProps {
  value: string
  className?: string
}

export const NumberPopIn = ({ value, className }: NumberPopInProps) => {
  const previous = useRef(value)
  const [from, setFrom] = useState(value)

  useEffect(() => {
    if (previous.current === value) return

    setFrom(previous.current)
    previous.current = value
  }, [value])

  let shared = 0
  while (shared < from.length && shared < value.length && from[shared] === value[shared]) {
    shared += 1
  }

  const changed = from !== value

  return (
    <span
      className={`t-digit-group${changed ? ' is-animating' : ''}${className ? ` ${className}` : ''}`}
    >
      {value.split('').map((character, index) => {
        if (index < shared || !/\d/.test(character)) {
          return (
            <span key={index} className="t-digit" data-same="">
              {character}
            </span>
          )
        }

        const fromEnd = value.length - 1 - index
        const old = from[from.length - (value.length - index)]
        const stagger = fromEnd === 1 ? '1' : fromEnd === 0 ? '2' : undefined

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
