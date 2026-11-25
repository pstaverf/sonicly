import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0'

const loadEnv = async () => {
  try {
    const raw = await readFile(join(root, '.env'), 'utf-8')
    const values = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index < 0) continue
      values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
    }
    return values
  } catch {
    return {}
  }
}

const buildQuery = (params) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  return search.toString()
}

const fetchJson = async (path, params) => {
  const url = `${JAMENDO_BASE_URL}${path}?${buildQuery(params)}`
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${path}`)
  return response.json()
}

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const buildSlug = (name, source, rawId) => {
  const base = slugify(name)
  const suffix = `${source}-${rawId}`
  return base ? `${base}-${suffix}` : suffix
}

const collectRealRoutes = async (clientId) => {
  const routes = new Set(['/'])

  if (!clientId) {
    console.warn('[prerender] VITE_JAMENDO_CLIENT_ID is not set — only static routes are prerendered')
    return [...routes]
  }

  const common = { client_id: clientId, format: 'json' }

  const [albums, artists, playlists, tracks] = await Promise.all([
    fetchJson('/albums', { ...common, limit: 12, order: 'releasedate_desc' }).catch(() => null),
    fetchJson('/artists', { ...common, limit: 8, order: 'name' }).catch(() => null),
    fetchJson('/playlists', { ...common, limit: 8 }).catch(() => null),
    fetchJson('/tracks', {
      ...common,
      limit: 10,
      order: 'popularity_week',
      audioformat: 'mp32',
      imagesize: 600,
      type: 'single albumtrack',
    }).catch(() => null),
  ])

  for (const album of albums?.results ?? []) {
    routes.add(`/album/${buildSlug(album.name, 'jamendo', album.id)}`)
  }

  for (const artist of artists?.results ?? []) {
    routes.add(`/artist/${buildSlug(artist.name, 'jamendo', artist.id)}`)
  }

  for (const playlist of playlists?.results ?? []) {
    routes.add(`/playlist/${buildSlug(playlist.name, 'jamendo', playlist.id)}`)
  }

  for (const track of tracks?.results ?? []) {
    routes.add(`/track/${buildSlug(track.name, 'jamendo', track.id)}`)
  }

  for (const genre of ['pop', 'rock', 'electronic', 'jazz', 'ambient']) {
    routes.add(`/genre/${genre}`)
  }

  routes.add('/search')

  return [...routes]
}

const env = await loadEnv()
const clientId = env.VITE_JAMENDO_CLIENT_ID ?? ''

let routes = ['/']
try {
  routes = await collectRealRoutes(clientId)
} catch (error) {
  console.warn(`[prerender] Jamendo is unreachable (${error.message}) — prerendering static routes only`)
}

const server = await createServer({
  root,
  configFile: join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
})

const { render } = await server.ssrLoadModule('/src/entry-server.tsx')

const rawTemplate = await readFile(join(distDir, 'index.html'), 'utf-8')

const ROOT_PATTERN = /<div id="root">\s*<\/div>/

const STATIC_SEO_PATTERNS = [
  /<title>[\s\S]*?<\/title>/g,
  /<meta name="description"[^>]*\/>/g,
  /<meta name="keywords"[^>]*\/>/g,
  /<link rel="canonical"[^>]*\/>/g,
  /<meta property="og:(title|description|image|url|type)"[^>]*\/>/g,
  /<meta name="twitter:(title|description|image)"[^>]*\/>/g,
]

const template = STATIC_SEO_PATTERNS.reduce(
  (html, pattern) => html.replace(pattern, ''),
  rawTemplate,
)

const serializeState = (state) =>
  JSON.stringify(state)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

const targetsFor = (path) => {
  const relative = path.replace(/^\//, '')
  if (relative === '') return ['index.html']
  return [`${relative}.html`, `${relative}/index.html`]
}

const written = []

for (const route of routes) {
  try {
    const { html, head, state } = await render(route)

    const normalizedHead = head.replace(/hrefLang=/g, 'hreflang=')

    const body = template
      .replace(ROOT_PATTERN, `<div id="root">${html}</div>`)
      .replace('</head>', `${normalizedHead}\n  </head>`)
      .replace(
        '<script type="module"',
        `<script>window.__SONICLY_STATE__=${serializeState(state)}</script>\n    <script type="module"`,
      )

    for (const file of targetsFor(route)) {
      const target = join(distDir, file)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, body, 'utf-8')
    }

    written.push(route)
    console.log(`prerendered ${route} -> ${targetsFor(route).join(', ')}`)
  } catch (error) {
    console.warn(`[prerender] skipped ${route}: ${error.message}`)
  }
}

const sitemap = buildSitemap(written)
await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf-8')
await writeFile(join(distDir, 'sitemap-en.xml'), buildSitemap(written, 'en'), 'utf-8')

console.log(`[prerender] ${written.length} routes written`)

await server.close()

function buildSitemap(paths, locale = 'ru') {
  const origin = 'https://sonicly.app'
  const entries = paths
    .filter((path) => !['/login', '/library'].includes(path))
    .map((path) => {
      const alternates = [locale, ...['ru', 'en', 'x-default'].filter((lang) => lang !== locale)]
        .map(
          (lang) =>
            `    <xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${path}"/>`,
        )
        .join('\n')
      return [
        '  <url>',
        `    <loc>${origin}${path}</loc>`,
        alternates,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    '</urlset>',
    '',
  ].join('\n')
}
