import { useEffect, useRef, useState } from 'react'

interface IntersectionOptions {
  rootMargin?: string
  threshold?: number
}

export const useIntersection = <T extends HTMLElement>(
  options: IntersectionOptions = {},
): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      {
        rootMargin: options.rootMargin ?? '320px',
        threshold: options.threshold ?? 0,
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [options.rootMargin, options.threshold])

  return [ref, visible]
}
