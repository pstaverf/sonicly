import { useCallback, useEffect, useRef } from 'react'

import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'

export interface TabItem {
  id: string
  label: string
}

interface SlidingTabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
  label?: string
  /** The row of tabs scrolls sideways on a narrow screen. */
  scrollable?: boolean
}

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const SlidingTabs = ({
  items,
  value,
  onChange,
  className,
  label,
  scrollable = false,
}: SlidingTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  // The index that the visitor picked. The pill travels to it, every other
  // change of the tab snaps the pill into place.
  const pickedIndexRef = useRef<number | null>(null)

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value),
  )

  const moveTo = useCallback(
    (index: number, animate: boolean) => {
      const tab = tabRefs.current[items[index]?.id ?? '']
      const pill = pillRef.current
      if (!tab || !pill) return

      const left = tab.offsetLeft
      const width = tab.offsetWidth

      if (!animate) {
        // The pill is placed without a transition, so it stands where the
        // tab stands before the first animation can start.
        const previous = pill.style.transition
        pill.style.transition = 'none'
        pill.style.transform = `translateX(${left}px)`
        pill.style.width = `${width}px`
        void pill.offsetWidth
        pill.style.transition = previous
        return
      }

      pill.style.transform = `translateX(${left}px)`
      pill.style.width = `${width}px`
    },
    [items],
  )

  const scrollTabIntoView = useCallback(
    (index: number) => {
      const tab = tabRefs.current[items[index]?.id ?? '']
      if (!tab || typeof tab.scrollIntoView !== 'function') return

      tab.scrollIntoView({ block: 'nearest', inline: 'center' })
    },
    [items],
  )

  useIsomorphicLayoutEffect(() => {
    const picked = pickedIndexRef.current
    pickedIndexRef.current = null

    // A tab that the visitor picked travels, everything else snaps.
    moveTo(activeIndex, picked === activeIndex && !prefersReducedMotion())

    if (scrollable) scrollTabIntoView(activeIndex)
  }, [activeIndex, moveTo, scrollable, scrollTabIntoView])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => moveTo(activeIndex, false))
    observer.observe(container)

    const tabs = Object.values(tabRefs.current)
    for (const tab of tabs) {
      if (tab) observer.observe(tab)
    }

    return () => observer.disconnect()
  }, [activeIndex, moveTo])

  useEffect(() => {
    let cancelled = false

    const ready = document.fonts?.ready
    if (!ready) return

    void ready.then(() => {
      if (!cancelled) moveTo(activeIndex, false)
    })

    return () => {
      cancelled = true
    }
  }, [activeIndex, moveTo])

  const pick = (index: number) => {
    const item = items[index]
    if (!item) return
    if (item.id === value) return

    pickedIndexRef.current = index
    onChange(item.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()

    const direction = event.key === 'ArrowRight' ? 1 : -1
    const next = Math.min(items.length - 1, Math.max(0, activeIndex + direction))
    const item = items[next]
    if (!item) return

    pickedIndexRef.current = next
    onChange(item.id)
    tabRefs.current[item.id]?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={`t-tabs hide-scrollbar${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(node) => {
            tabRefs.current[item.id] = node
          }}
          type="button"
          role="tab"
          id={`tab-${item.id}`}
          aria-selected={item.id === value}
          aria-controls={`panel-${item.id}`}
          tabIndex={item.id === value ? 0 : -1}
          className="t-tab"
          onClick={() => pick(index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
