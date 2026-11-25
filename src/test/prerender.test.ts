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
    expect(rootMarkup).toContain('bg-background')
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
    expect(state.queries.length).toBeGreaterThan(0)
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

  it('prerenders every public route', () => {
    for (const route of ['search', 'library', 'login', 'album/1', 'playlist/1']) {
      expect(existsSync(join(distDir, route, 'index.html'))).toBe(true)
    }
  })

  it('keeps canonical and open graph metadata', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')

    expect(html).toContain('rel="canonical"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('application/ld+json')
  })

  it('emits a single title, description and canonical per page', () => {
    for (const route of ['index', 'search', 'library', 'album/1', 'playlist/1', 'login']) {
      const html = readFileSync(join(distDir, `${route}.html`), 'utf-8')
      const head = html.slice(0, html.indexOf('</head>'))

      expect(head.match(/<title/g) ?? []).toHaveLength(1)
      expect(head.match(/name="description"/g) ?? []).toHaveLength(1)
      expect(head.match(/rel="canonical"/g) ?? []).toHaveLength(1)
      expect(head.match(/property="og:title"/g) ?? []).toHaveLength(1)
      expect(head.match(/property="og:site_name"/g) ?? []).toHaveLength(1)
    }
  })

  it('gives every route its own page title', () => {
    const titles = ['index', 'search', 'library', 'album/1', 'playlist/1', 'login'].map(
      (route) => {
        const html = readFileSync(join(distDir, `${route}.html`), 'utf-8')
        return /<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1]
      },
    )

    expect(new Set(titles).size).toBe(titles.length)
    expect(titles.every((title) => typeof title === 'string' && title.length > 0)).toBe(true)
  })
})

describe('static assets', () => {
  it('ships a cover in every modern format', () => {
    for (let id = 1; id <= 20; id += 1) {
      expect(existsSync(join(publicDir, 'covers', `${id}.jpg`))).toBe(true)
      expect(existsSync(join(publicDir, 'covers', `${id}.webp`))).toBe(true)
      expect(existsSync(join(publicDir, 'covers', `${id}.avif`))).toBe(true)
    }
  })

  it('ships an audio file for every track', () => {
    for (let id = 1; id <= 20; id += 1) {
      expect(existsSync(join(publicDir, 'audio', `${id}.mp3`))).toBe(true)
    }
  })

  it('ships the social preview image and seo files', () => {
    expect(existsSync(join(publicDir, 'og-image.jpg'))).toBe(true)
    expect(existsSync(join(publicDir, 'robots.txt'))).toBe(true)
    expect(existsSync(join(publicDir, 'sitemap.xml'))).toBe(true)
    expect(existsSync(join(publicDir, 'manifest.webmanifest'))).toBe(true)
  })
})
