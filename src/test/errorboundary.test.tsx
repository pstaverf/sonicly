import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from '../components/ErrorBoundary'

const Boom = () => {
  throw new Error('the page is broken')
}

describe('the border of a broken page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a message when a page breaks', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <ErrorBoundary resetKey="/track/one">
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('button', { name: /Главная|Home/i })).toBeInTheDocument()
  })

  it('forgets the error when another route is opened', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { rerender } = render(
      <ErrorBoundary resetKey="/track/one">
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('button', { name: /Главная|Home/i })).toBeInTheDocument()

    rerender(
      <ErrorBoundary resetKey="/library">
        <p>the page is open</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('the page is open')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Главная|Home/i })).not.toBeInTheDocument()
  })
})
