import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

const routes = [
  { path: '/' },
  { path: '/search' },
  { path: '/library' },
  { path: '/album/1' },
  { path: '/album/2' },
  { path: '/album/3' },
  { path: '/playlist/1' },
  { path: '/playlist/2' },
  { path: '/playlist/3' },
  { path: '/login' },
]

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

for (const route of routes) {
  const { html, head, state } = await render(route.path)

  const body = template
    .replace(ROOT_PATTERN, `<div id="root">${html}</div>`)
    .replace('</head>', `${head}\n  </head>`)
    .replace(
      '<script type="module"',
      `<script>window.__SONICLY_STATE__=${serializeState(state)}</script>\n    <script type="module"`,
    )

  for (const file of targetsFor(route.path)) {
    const target = join(distDir, file)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, body, 'utf-8')
  }

  console.log(`prerendered ${route.path} -> ${targetsFor(route.path).join(', ')}`)
}

await server.close()
