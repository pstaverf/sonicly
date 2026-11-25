import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InputShake } from '../components/motion/InputShake'
import { LikeButton } from '../components/motion/LikeButton'
import { SkeletonReveal } from '../components/motion/SkeletonReveal'
import { SlidingTabs } from '../components/motion/SlidingTabs'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { SubtleNumber } from '../components/motion/SubtleNumber'
import { TextSwap } from '../components/motion/TextSwap'

const items = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
]

/** The row of tabs is led by the page, so the test needs a page of its own. */
const TabsHarness = ({
  onChange,
  scrollable = false,
}: {
  onChange?: (id: string) => void
  scrollable?: boolean
}) => {
  const [value, setValue] = useState('one')

  return (
    <SlidingTabs
      items={items}
      value={value}
      onChange={(id) => {
        setValue(id)
        onChange?.(id)
      }}
      scrollable={scrollable}
    />
  )
}

/** The tabs have no size in jsdom, so the places of the tabs are given. */
const giveTheTabsTheirPlaces = (width = 50, step = 60) => {
  const tabs = screen.getAllByRole('tab')

  tabs.forEach((tab, index) => {
    Object.defineProperty(tab, 'offsetLeft', { value: index * step, configurable: true })
    Object.defineProperty(tab, 'offsetWidth', { value: width, configurable: true })
  })
}

/** The writes of the transition of the pill tell a travel from a snap. */
const watchTheTransition = (pill: HTMLElement) => {
  const writes: string[] = []
  const style = pill.style

  let proto: object | null = Object.getPrototypeOf(style)
  let descriptor: PropertyDescriptor | undefined

  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, 'transition')
    proto = Object.getPrototypeOf(proto)
  }

  if (!descriptor?.get || !descriptor.set) return writes

  Object.defineProperty(style, 'transition', {
    configurable: true,
    get() {
      return descriptor.get?.call(style)
    },
    set(value: string) {
      writes.push(String(value))
      descriptor.set?.call(style, value)
    },
  })

  return writes
}

describe('the row of tabs', () => {
  it('travels with the pill to the tab that was picked', () => {
    const onChange = vi.fn()

    const { container } = render(<TabsHarness onChange={onChange} />)

    const pill = container.querySelector<HTMLElement>('.t-tabs-pill')
    if (!pill) throw new Error('the pill is missing')

    const writes = watchTheTransition(pill)
    giveTheTabsTheirPlaces()

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))

    expect(onChange).toHaveBeenCalledWith('two')
    expect(pill.style.transform).toBe('translateX(60px)')
    expect(pill.style.width).toBe('50px')
    // A travel keeps the transition alive, the pill does not jump.
    expect(writes).not.toContain('none')
  })

  it('snaps the pill when the tab changes without a click', () => {
    const { container, rerender } = render(
      <SlidingTabs items={items} value="one" onChange={() => undefined} />,
    )

    const pill = container.querySelector<HTMLElement>('.t-tabs-pill')
    if (!pill) throw new Error('the pill is missing')

    const writes = watchTheTransition(pill)
    giveTheTabsTheirPlaces()

    rerender(<SlidingTabs items={items} value="three" onChange={() => undefined} />)

    expect(pill.style.transform).toBe('translateX(120px)')
    // The pill stands where the tab stands before the animation can start.
    expect(writes).toContain('none')
    expect(pill.style.transition).toBe('')
  })

  it('snaps the pill when the visitor asks for less motion', () => {
    const original = window.matchMedia

    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    try {
      const { container } = render(<TabsHarness />)

      const pill = container.querySelector<HTMLElement>('.t-tabs-pill')
      if (!pill) throw new Error('the pill is missing')

      const writes = watchTheTransition(pill)
      giveTheTabsTheirPlaces()

      fireEvent.click(screen.getByRole('tab', { name: 'Two' }))

      expect(pill.style.transform).toBe('translateX(60px)')
      expect(writes).toContain('none')
    } finally {
      window.matchMedia = original
    }
  })

  it('brings the open tab into the view of a narrow screen', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')

    render(
      <SlidingTabs items={items} value="two" onChange={() => undefined} scrollable />,
    )

    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.instances[0]).toBe(screen.getByRole('tab', { name: 'Two' }))
  })

  it('moves the pill with the arrow keys', () => {
    const onChange = vi.fn()

    render(<SlidingTabs items={items} value="one" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledWith('two')
  })
})

describe('the field that shakes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the error and shakes the field', () => {
    const { container } = render(
      <InputShake error message="The name is needed">
        <input />
      </InputShake>,
    )

    const wrap = container.querySelector<HTMLElement>('.t-input-wrap')
    const field = container.querySelector<HTMLElement>('.t-input')

    expect(wrap?.className).toContain('is-error')
    expect(field?.className).toContain('is-error')
    expect(field?.className).toContain('is-shaking')
    expect(container.querySelector('.t-error-msg')?.textContent).toBe('The name is needed')
  })

  it('shakes again when the error comes back', () => {
    const { container, rerender } = render(
      <InputShake error message="The name is needed">
        <input />
      </InputShake>,
    )

    act(() => {
      vi.advanceTimersByTime(400)
    })

    const field = container.querySelector<HTMLElement>('.t-input')
    expect(field?.className).not.toContain('is-shaking')

    rerender(
      <InputShake error trigger={1} message="The name is needed">
        <input />
      </InputShake>,
    )

    expect(container.querySelector<HTMLElement>('.t-input')?.className).toContain('is-shaking')
  })

  it('returns to the calm state after the hold', () => {
    const onReset = vi.fn()

    const { container } = render(
      <InputShake error onReset={onReset} message="The name is needed">
        <input />
      </InputShake>,
    )

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(container.querySelector<HTMLElement>('.t-input-wrap')?.className).not.toContain(
      'is-error',
    )
    expect(onReset).toHaveBeenCalled()
  })

  it('drops the error when the visitor writes', () => {
    const onReset = vi.fn()

    const { container } = render(
      <InputShake error onReset={onReset} message="The name is needed">
        <input />
      </InputShake>,
    )

    fireEvent.input(container.querySelector('input') as HTMLInputElement, {
      target: { value: 'a' },
    })

    expect(container.querySelector<HTMLElement>('.t-input-wrap')?.className).not.toContain(
      'is-error',
    )
    expect(onReset).toHaveBeenCalled()
  })

  it('leaves no timer behind when the field goes away', () => {
    const { unmount } = render(
      <InputShake error message="The name is needed">
        <input />
      </InputShake>,
    )

    expect(vi.getTimerCount()).toBeGreaterThan(0)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('the heart of a track', () => {
  it('sprays the particles when the track is liked', () => {
    const onToggle = vi.fn()

    const { container, rerender } = render(
      <LikeButton liked={false} onToggle={onToggle} label="Like" />,
    )

    const button = screen.getByRole('button', { name: 'Like' })

    expect(button).toHaveAttribute('data-liked', 'false')
    expect(button.className).not.toContain('is-bursting')

    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalled()

    rerender(<LikeButton liked onToggle={onToggle} label="Unlike" />)

    expect(button).toHaveAttribute('data-liked', 'true')
    expect(button.className).toContain('is-bursting')

    const dots = container.querySelectorAll<HTMLElement>('.t-like-particles i')
    expect(dots).toHaveLength(8)
    expect(dots[0].style.getPropertyValue('--px')).not.toBe('')
    expect(dots[0].style.getPropertyValue('--py')).not.toBe('')
  })

  it('keeps the burst short', () => {
    vi.useFakeTimers()

    try {
      const { container, rerender } = render(
        <LikeButton liked={false} onToggle={() => undefined} label="Like" />,
      )

      rerender(<LikeButton liked onToggle={() => undefined} label="Unlike" />)

      const button = container.querySelector<HTMLElement>('.t-like')
      expect(button?.className).toContain('is-bursting')

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(button?.className).not.toContain('is-bursting')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('the text that changes', () => {
  it('lets the old text go and brings the new one', async () => {
    const { container, rerender } = render(<TextSwap text="Copy link" />)

    const node = container.querySelector<HTMLElement>('.t-text-swap')
    if (!node) throw new Error('the text is missing')

    const states: string[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.oldValue) states.push(record.oldValue)
      }
    })
    observer.observe(node, { attributes: true, attributeFilter: ['class'], attributeOldValue: true })

    rerender(<TextSwap text="Link copied" />)

    expect(screen.getByText('Copy link')).toBeInTheDocument()
    expect(node.className).toContain('is-exit')

    await waitFor(() => {
      expect(screen.getByText('Link copied')).toBeInTheDocument()
    })

    observer.disconnect()

    expect(states.some((state) => state.includes('is-exit'))).toBe(true)
    expect(states.some((state) => state.includes('is-enter-start'))).toBe(true)
    expect(node.className).not.toContain('is-exit')
  })
})

describe('the number that counts on', () => {
  it('keeps the digits that stand and moves the ones that changed', () => {
    const { container, rerender } = render(<SubtleNumber value="01:23" />)

    expect(container.querySelectorAll('.t-subtle-slot')).toHaveLength(0)

    rerender(<SubtleNumber value="01:24" />)

    const slots = container.querySelectorAll('.t-subtle-slot')
    expect(slots).toHaveLength(1)
    expect(slots[0].querySelector('.t-subtle-old')?.textContent).toBe('3')
    expect(slots[0].querySelector('.t-subtle-new')?.textContent).toBe('4')
    expect(container.querySelector('.t-subtle-number')?.className).toContain('is-animating')
    expect(
      container.querySelector<HTMLElement>('.t-subtle-number')?.style.getPropertyValue(
        '--subtle-dir',
      ),
    ).toBe('1')
  })

  it('lets the number fall when it goes down', () => {
    const { container, rerender } = render(<SubtleNumber value="01:24" />)

    rerender(<SubtleNumber value="01:20" />)

    expect(
      container.querySelector<HTMLElement>('.t-subtle-number')?.style.getPropertyValue(
        '--subtle-dir',
      ),
    ).toBe('-1')
  })
})

describe('the slot of the skeleton', () => {
  it('reveals the content when the data arrives', () => {
    const { container, rerender } = render(
      <SkeletonReveal loading skeleton={<div>skeleton</div>}>
        <div>content</div>
      </SkeletonReveal>,
    )

    const slot = container.querySelector<HTMLElement>('.t-skel')
    expect(slot?.className).not.toContain('is-revealed')
    expect(container.querySelector('.t-skel-skeleton')?.className).toContain('is-pulsing')

    rerender(
      <SkeletonReveal loading={false} skeleton={<div>skeleton</div>}>
        <div>content</div>
      </SkeletonReveal>,
    )

    expect(container.querySelector<HTMLElement>('.t-skel')?.className).toContain('is-revealed')
  })

  it('plays the loading state again without the motion of the way back', () => {
    const { container, rerender } = render(
      <SkeletonReveal loading={false} skeleton={<div>skeleton</div>}>
        <div>content</div>
      </SkeletonReveal>,
    )

    expect(container.querySelector<HTMLElement>('.t-skel')?.className).toContain('is-revealed')

    rerender(
      <SkeletonReveal loading skeleton={<div>skeleton</div>}>
        <div>content</div>
      </SkeletonReveal>,
    )

    expect(container.querySelector<HTMLElement>('.t-skel')?.className).not.toContain('is-revealed')
    expect(container.querySelector('.t-skel-skeleton')?.className).toContain('is-pulsing')
  })
})

describe('the lines of the chart', () => {
  it('come into the view one after the other', () => {
    const { container } = render(
      <Stagger>
        <StaggerItem index={0}>first</StaggerItem>
        <StaggerItem index={1}>second</StaggerItem>
      </Stagger>,
    )

    expect(container.querySelector('.t-stagger')?.className).toContain('is-shown')

    const lines = container.querySelectorAll<HTMLElement>('.t-stagger-line')
    expect(lines).toHaveLength(2)
    expect(lines[1].style.getPropertyValue('--stagger-index')).toBe('1')
  })
})
