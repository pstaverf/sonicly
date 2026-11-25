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

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  // jsdom does not scroll on its own, so the call of the tabs is answered
  // with a stub that keeps the tests free of errors.
  Element.prototype.scrollIntoView = function scrollIntoView() {}
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
