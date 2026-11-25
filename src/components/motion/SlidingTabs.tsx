import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

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
}

export const SlidingTabs = ({ items, value, onChange, className, label }: SlidingTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value),
  )

  const moveTo = useCallback((index: number, animate: boolean) => {
    const tab = tabRefs.current[items[index]?.id ?? '']
    const pill = pillRef.current
    if (!tab || !pill) return

    const left = tab.offsetLeft
    const width = tab.offsetWidth

    if (!animate) {
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
  }, [items])

  useLayoutEffect(() => {
    moveTo(activeIndex, false)
  }, [activeIndex, moveTo])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()

    const direction = event.key === 'ArrowRight' ? 1 : -1
    const next = Math.min(items.length - 1, Math.max(0, activeIndex + direction))
    const item = items[next]
    if (!item) return

    onChange(item.id)
    tabRefs.current[item.id]?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={`t-tabs${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {items.map((item) => (
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
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
