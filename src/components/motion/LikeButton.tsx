import { useEffect, useRef } from 'react'

interface LikeButtonProps {
  liked: boolean
  onToggle: () => void
  /** The name of the button, so it can be read out. */
  label: string
  className?: string
  /** The name next to the heart. */
  text?: string
}

const PARTICLES = 8
const PARTICLE_DURATION = 600

export const LikeButton = ({ liked, onToggle, label, className, text }: LikeButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const burstTimer = useRef<number | null>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    if (burstTimer.current !== null) {
      window.clearTimeout(burstTimer.current)
      burstTimer.current = null
    }

    if (!liked) {
      button.classList.remove('is-bursting')
      return
    }

    // Every particle gets its own way, so the burst looks like a spray and
    // not like a ring.
    const dots = button.querySelectorAll<HTMLElement>('.t-like-particles i')

    dots.forEach((dot, index) => {
      const angle = (index / PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.6
      const distance = 20 * (0.55 + Math.random() * 0.65)

      dot.style.setProperty('--px', `${(Math.cos(angle) * distance).toFixed(2)}px`)
      dot.style.setProperty('--py', `${(Math.sin(angle) * distance).toFixed(2)}px`)
      dot.style.setProperty('--pdur', `${Math.round(PARTICLE_DURATION * (0.75 + Math.random() * 0.5))}ms`)
      dot.style.setProperty('--pdelay', `${Math.round(index * 14)}ms`)
      dot.style.setProperty('--p-end-scale', (0.4 + Math.random() * 0.35).toFixed(2))
      dot.style.setProperty('--psize', (0.8 + Math.random() * 0.6).toFixed(2))
    })

    button.classList.add('is-bursting')

    burstTimer.current = window.setTimeout(() => {
      burstTimer.current = null
      button.classList.remove('is-bursting')
    }, PARTICLE_DURATION + 200)

    return () => {
      if (burstTimer.current !== null) {
        window.clearTimeout(burstTimer.current)
        burstTimer.current = null
      }
    }
  }, [liked])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      className={`t-like${className ? ` ${className}` : ''}`}
      data-liked={liked}
      aria-label={label}
      aria-pressed={liked}
    >
      <span className="t-like-icon">
        <svg
          className="t-like-heart"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 20.7l-1.45-1.32C5.6 14.9 2.4 11.94 2.4 8.4A5.6 5.6 0 0 1 8 2.8c1.55 0 3.03.72 4 1.92A5.36 5.36 0 0 1 16 2.8a5.6 5.6 0 0 1 5.6 5.6c0 3.54-3.2 6.5-8.15 10.98L12 20.7z"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="t-like-particles" aria-hidden="true">
        {Array.from({ length: PARTICLES }, (_, index) => (
          <i key={index} />
        ))}
      </span>

      {text && <span>{text}</span>}
    </button>
  )
}
