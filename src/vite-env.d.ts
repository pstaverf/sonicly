/// <reference types="vite/client" />

declare global {
  interface Window {
    __SONICLY_STATE__?: string
  }
}

export {}
