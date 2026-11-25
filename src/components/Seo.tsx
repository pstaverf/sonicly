import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

import {
  absoluteUrl,
  buildBreadcrumb,
  buildOrganization,
  buildWebsite,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  truncate,
} from '../lib/seo'
import type { BreadcrumbItem } from '../lib/seo'

interface SeoProps {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'music.song' | 'music.album' | 'music.playlist' | 'profile'
  noindex?: boolean
  breadcrumbs?: BreadcrumbItem[]
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export const Seo = ({
  title,
  description,
  path,
  image = OG_IMAGE,
  type = 'website',
  noindex = false,
  breadcrumbs,
  jsonLd,
}: SeoProps) => {
  const { i18n } = useTranslation()
  const language = i18n.language === 'en' ? 'en' : 'ru'

  const fullTitle = truncate(`${title} | ${SITE_NAME}`, 60)
  const metaDescription = truncate(description, 155)
  const canonical = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  const structured = [
    buildWebsite(),
    buildOrganization(),
    ...(breadcrumbs ? [buildBreadcrumb(breadcrumbs)] : []),
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ]

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="ru" href={absoluteUrl(path)} />
      <link rel="alternate" hrefLang="en" href={absoluteUrl(path)} />
      <link rel="alternate" hrefLang="x-default" href={absoluteUrl(path)} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={language === 'en' ? 'en_US' : 'ru_RU'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@sonicly" />

      <script type="application/ld+json">{JSON.stringify(structured)}</script>
    </Helmet>
  )
}

export const SITE = SITE_URL
