// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'
import { describe, expect, it } from 'vitest'

import '../i18n'
import { Seo } from '../components/Seo'

/**
 * The catalogue is filled by the artists of jamendo and audius, so a title is
 * content of a third party. The structured data goes into the html as it is,
 * which means a title has to be unable to close the script tag.
 */
const renderHead = (title: string): string => {
  const context: { helmet?: HelmetServerState | null } = {}

  renderToString(
    <HelmetProvider context={context}>
      <Seo
        title={title}
        description={title}
        path="/track/some-track-jamendo-1"
        jsonLd={{ '@type': 'MusicRecording', name: title }}
      />
    </HelmetProvider>,
  )

  return context.helmet?.script?.toString() ?? ''
}

describe('structured data of untrusted titles', () => {
  it('cannot close the script tag', () => {
    const head = renderHead('</script><script>alert(1)</script>')

    expect(head).not.toContain('</script><script>')
  })

  it('keeps the payload inside the json', () => {
    const head = renderHead('</script><img src=x onerror=alert(1)>')

    const match = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/.exec(head)

    expect(match).not.toBeNull()

    const payload = JSON.parse(match?.[1] ?? '[]') as { name: string }[]

    expect(payload.at(-1)?.name).toBe('</script><img src=x onerror=alert(1)>')
  })

  it('escapes the angle brackets of every untrusted value', () => {
    const head = renderHead('a < b && c > d')

    expect(head).not.toContain('< b ')
    expect(head).toContain('\\u003c')
  })
})
