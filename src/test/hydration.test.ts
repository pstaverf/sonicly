import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

const distDir = join(process.cwd(), 'dist')
const built = existsSync(join(distDir, 'index.html'))

afterEach(() => {
  vi.restoreAllMocks()
})

describe.skipIf(!built)('client hydration', () => {
  it('hydrates the prerendered markup without wiping the page', async () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8')
    const rootMatch = /<div id="root">([\s\S]*?)<\/body>/.exec(html)
    const stateMatch = /window\.__SONICLY_STATE__=(\{[\s\S]*?\});?<\/script>/.exec(html)

    expect(rootMatch).not.toBeNull()
    expect(stateMatch).not.toBeNull()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    document.body.innerHTML = html.slice(html.indexOf('<body>'), html.indexOf('</body>'))
    window.__SONICLY_STATE__ = stateMatch?.[1]

    const root = document.getElementById('root')
    expect(root).not.toBeNull()
    expect(root?.childElementCount).toBeGreaterThan(0)

    const markupBefore = root?.innerHTML ?? ''

    await import('../main')

    await new Promise((resolve) => setTimeout(resolve, 200))

    const markupAfter = root?.innerHTML ?? ''

    expect(markupAfter.length).toBeGreaterThan(1000)
    expect(markupAfter).toContain('Sonicly')
    expect(markupBefore.length).toBeGreaterThan(0)

    const reported = consoleError.mock.calls.map((call) => String(call[0])).join('\n')

    expect(reported).not.toMatch(/did not match/i)
    expect(reported).not.toMatch(/hydrat/i)
  })
})
