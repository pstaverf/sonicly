import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface SkeletonRevealProps {
  loading: boolean
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

export const SkeletonReveal = ({
  loading,
  skeleton,
  children,
  className,
}: SkeletonRevealProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = wrapRef.current
    if (!node || !loading) return

    const skeletonNode = node.querySelector<HTMLElement>('.t-skel-skeleton')

    // The loading state is replayed without the motion of the way back.
    node.classList.add('is-resetting')
    node.classList.remove('is-revealed')
    skeletonNode?.classList.remove('is-pulsing')
    void node.offsetWidth
    node.classList.remove('is-resetting')
    skeletonNode?.classList.add('is-pulsing')
  }, [loading])

  // The slot keeps the height of the content, so the swap costs no space.
  useEffect(() => {
    const wrap = wrapRef.current
    const content = contentRef.current
    if (!wrap || !content) return

    const apply = () => {
      const height = content.offsetHeight

      wrap.style.minHeight = height > 0 ? `${height}px` : ''
    }

    apply()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(apply)
    observer.observe(content)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`t-skel${loading ? '' : ' is-revealed'}${className ? ` ${className}` : ''}`}
      data-state={loading ? 'loading' : 'revealed'}
    >
      <div className="t-skel-skeleton is-pulsing">{skeleton}</div>
      <div ref={contentRef} className="t-skel-content">
        {children}
      </div>
    </div>
  )
}
