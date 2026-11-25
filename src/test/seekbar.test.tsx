import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SeekBar } from '../components/SeekBar'

describe('seek bar', () => {
  it('moves the track with the arrow keys', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} onSeek={onSeek} />)

    const bar = screen.getByRole('slider')

    fireEvent.keyDown(bar, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(35)

    fireEvent.keyDown(bar, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenLastCalledWith(25)

    fireEvent.keyDown(bar, { key: 'Home' })
    expect(onSeek).toHaveBeenLastCalledWith(0)

    fireEvent.keyDown(bar, { key: 'End' })
    expect(onSeek).toHaveBeenLastCalledWith(120)
  })

  it('does not move outside of the track', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={2} duration={120} onSeek={onSeek} />)

    const bar = screen.getByRole('slider')

    fireEvent.keyDown(bar, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenLastCalledWith(0)
  })

  it('tells the screen reader where the track stands', () => {
    render(<SeekBar currentTime={65} duration={120} onSeek={vi.fn()} />)

    const bar = screen.getByRole('slider')

    expect(bar).toHaveAttribute('aria-valuenow', '65')
    expect(bar).toHaveAttribute('aria-valuemax', '120')
    expect(bar).toHaveAttribute('aria-valuetext', '1:05 / 2:00')
  })

  it('does not let the fill run past the end of the track', () => {
    render(<SeekBar currentTime={999} duration={120} onSeek={vi.fn()} />)

    const bar = screen.getByRole('slider')
    const fill = bar.firstElementChild as HTMLElement

    expect(fill.style.width).toBe('100%')
  })
})
