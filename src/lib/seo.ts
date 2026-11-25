export const SITE_URL = 'https://sonicly.app'

export const SITE_NAME = 'Sonicly'

export const SITE_LOCALE = 'ru_RU'

export const OG_IMAGE = `${SITE_URL}/og-image.svg`

export const SEO_DESCRIPTION =
  'Sonicly — музыка без регистрации: Jamendo и Audius в одном плеере. Любимые треки, альбомы, артисты и плейлисты под лицензиями Creative Commons.'

export const truncate = (value: string, max: number): string => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

export const absoluteUrl = (path: string): string => {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export const buildBreadcrumb = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const buildWebsite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: ['ru', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
})

export const buildOrganization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/icon-512.png'),
  sameAs: ['https://github.com/pstaverf/sonicly'],
})
