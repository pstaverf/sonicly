import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const distDir = join(process.cwd(), 'dist')
const publicDir = join(process.cwd(), 'public')

const built = existsSync(join(distDir, 'index.html'))

describe.skipIf(!built)('prerendered output', () => {
  it('ships a complete html document', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('<meta charset="UTF-8" />')
  })

  it('renders the application markup inside the root element', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')
    const rootMarkup = html.slice(html.indexOf('<div id="root">'))

    expect(rootMarkup.length).toBeGreaterThan(2000)
    expect(rootMarkup).toContain('Sonicly')
  })

  it('injects the dehydrated query state for hydration', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')
    const match = /window\.__SONICLY_STATE__=(.*?)<\/script>/s.exec(html)

    expect(match).not.toBeNull()

    const state = JSON.parse(match?.[1] ?? '{}') as {
      mutations: unknown[]
      queries: unknown[]
    }

    expect(Array.isArray(state.queries)).toBe(true)
  })

  it('references only static assets that exist', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')
    const sources = [...html.matchAll(/(?:src|href)="\/([^"]+)"/g)]
      .map((match) => match[1])
      .filter((source) => /\.[a-z0-9]+$/i.test(source))

    expect(sources.length).toBeGreaterThan(0)

    for (const source of sources) {
      if (source.startsWith('assets/')) {
        expect(existsSync(join(distDir, source))).toBe(true)
        continue
      }
      expect(existsSync(join(publicDir, source))).toBe(true)
    }
  })

  it('prerenders the public routes', () => {
    expect(existsSync(join(distDir, 'search', 'index.html'))).toBe(true)
    expect(existsSync(join(distDir, 'genre', 'pop', 'index.html'))).toBe(true)
  })

  it('keeps canonical and open graph metadata', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')

    expect(html).toContain('rel="canonical"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('hreflang="x-default"')
  })

  it('emits a single title, description and canonical per page', () => {
    for (const route of ['index', 'search', 'genre/pop']) {
      const html = readFileSync(join(distDir, `${route}.html`), 'utf-8')
      const head = html.slice(0, html.indexOf('</head>'))

      expect(head.match(/<title/g) ?? []).toHaveLength(1)
      expect(head.match(/name="description"/g) ?? []).toHaveLength(1)
      expect(head.match(/rel="canonical"/g) ?? []).toHaveLength(1)
      expect(head.match(/property="og:title"/g) ?? []).toHaveLength(1)
      expect(head.match(/property="og:site_name"/g) ?? []).toHaveLength(1)
    }
  })

  it('keeps page titles within the seo length budget', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')
    const title = /<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1] ?? ''

    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThanOrEqual(60)
  })

  it('generates a multilingual sitemap', () => {
    for (const file of ['sitemap.xml', 'sitemap-en.xml']) {
      const xml = readFileSync(join(distDir, file), 'utf-8')

      expect(xml).toContain('<urlset')
      expect(xml).toContain('hreflang="ru"')
      expect(xml).toContain('hreflang="en"')
      expect(xml).toContain('hreflang="x-default"')
    }
  })
})

describe('static assets', () => {
  it('ships the social preview image and seo files', () => {
    expect(existsSync(join(publicDir, 'og-image.jpg'))).toBe(true)
    expect(existsSync(join(publicDir, 'og-image.png'))).toBe(true)
    expect(existsSync(join(publicDir, 'robots.txt'))).toBe(true)
    expect(existsSync(join(publicDir, 'sitemap.xml'))).toBe(true)
    expect(existsSync(join(publicDir, 'manifest.webmanifest'))).toBe(true)
    expect(existsSync(join(publicDir, 'favicon.svg'))).toBe(true)
  })

  it('ships the application icons', () => {
    expect(existsSync(join(publicDir, 'icon-192.png'))).toBe(true)
    expect(existsSync(join(publicDir, 'icon-512.png'))).toBe(true)
  })

  it('does not ship mock audio or cover collections', () => {
    expect(existsSync(join(publicDir, 'covers'))).toBe(false)
    expect(existsSync(join(publicDir, 'audio'))).toBe(false)
  })
})
