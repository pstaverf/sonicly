const cache = new Map<string, string>()

const FALLBACK_PALETTE = ['#7C3AED', '#0EA5E9', '#F43F5E', '#22C55E', '#F59E0B', '#8B5CF6']

export const fallbackColor = (seed: string): string => {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}

const toHex = (red: number, green: number, blue: number): string => {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
  return `#${[red, green, blue].map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`
}

const paint = (image: HTMLImageElement, size: number): string | null => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(image, 0, 0, size, size)

  const { data } = context.getImageData(0, 0, size, size)
  let red = 0
  let green = 0
  let blue = 0
  let weight = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]
    if (alpha < 128) continue

    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const brightness = (r + g + b) / 3
    const saturation = Math.max(r, g, b) - Math.min(r, g, b)

    const emphasis = brightness * 0.35 + saturation * 0.65
    if (emphasis < 24) continue

    red += r * emphasis
    green += g * emphasis
    blue += b * emphasis
    weight += emphasis
  }

  if (weight === 0) return null

  return toHex(red / weight, green / weight, blue / weight)
}

export const extractDominantColor = async (url: string, seed: string): Promise<string> => {
  const cached = cache.get(url)
  if (cached) return cached

  if (typeof window === 'undefined') return fallbackColor(seed)

  const fallback = fallbackColor(seed)

  const color = await new Promise<string>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'

    const timeout = window.setTimeout(() => resolve(fallback), 6000)

    image.onload = () => {
      window.clearTimeout(timeout)
      try {
        resolve(paint(image, 24) ?? fallback)
      } catch {
        resolve(fallback)
      }
    }

    image.onerror = () => {
      window.clearTimeout(timeout)
      resolve(fallback)
    }

    image.src = url
  })

  cache.set(url, color)
  return color
}
