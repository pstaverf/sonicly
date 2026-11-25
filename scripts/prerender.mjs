import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

const STATIC_ROUTES = ['/', '/search']
const GENRE_ROUTES = ['pop', 'rock', 'electronic', 'jazz', 'ambient'].map(
  (genre) => `/genre/${genre}`,
)

const server = await createServer({
  root,
  configFile: join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
})

const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
const fetchers = await server.ssrLoadModule('/src/api/fetchers.ts')

/**
 * The routes are discovered through the very same fetchers the app uses, so a
 * prerendered page always points at a slug the router can resolve.
 */
const collectRealRoutes = async () => {
  const routes = new Set([...STATIC_ROUTES, ...GENRE_ROUTES])

  const [tracks, albums, artists, playlists] = await Promise.all([
    fetchers.fetchPopular().catch(() => []),
    fetchers.fetchAlbums().catch(() => []),
    fetchers.fetchArtists().catch(() => []),
    fetchers.fetchPlaylistsOfDay().catch(() => []),
  ])

  for (const track of tracks) routes.add(`/track/${track.slug}`)
  for (const album of albums) routes.add(`/album/${album.slug}`)
  for (const artist of artists) routes.add(`/artist/${artist.slug}`)
  for (const playlist of playlists) routes.add(`/playlist/${playlist.slug}`)

  return [...routes]
}

let routes = STATIC_ROUTES
try {
  routes = await collectRealRoutes()
} catch (error) {
  console.warn(`[prerender] route discovery failed (${error.message}) — static routes only`)
}

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
