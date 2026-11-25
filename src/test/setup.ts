import '@testing-library/jest-dom/vitest'

const isBrowser = typeof window !== 'undefined'

if (isBrowser) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })

  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverStub,
  })

  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => undefined,
  })
}

if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: () => true,
  })

  Object.defineProperty(navigator, 'language', {
    writable: true,
    value: 'ru-RU',
  })
}
