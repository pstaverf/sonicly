import { afterEach, describe, expect, it, vi } from 'vitest'

import { copyToClipboard } from '../lib/clipboard'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

const setClipboard = (value: unknown) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value,
  })
}

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard)
  } else {
    delete (navigator as { clipboard?: unknown }).clipboard
  }
  vi.restoreAllMocks()
})

describe('copy to the clipboard', () => {
  it('uses the api of the browser', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await expect(copyToClipboard('https://sonicly.app')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://sonicly.app')
  })

  it('falls back to the old command when the browser refuses', async () => {
    setClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    })

    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: execCommand,
    })

    await expect(copyToClipboard('https://sonicly.app')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('keeps the field out of the page after the copy', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(true),
    })

    await copyToClipboard('https://sonicly.app')

    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('does not copy an empty text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await expect(copyToClipboard('')).resolves.toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })
})
