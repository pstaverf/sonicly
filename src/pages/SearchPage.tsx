import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

import { useTracks } from '../api'
import { CoverImage } from '../components/CoverImage'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Поиск — Sonicly',
  url: 'https://sonicly.com/search',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://sonicly.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export const SearchPage = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const { data: tracks } = useTracks()

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return (
      tracks?.filter(
        (track) =>
          track.title.toLowerCase().includes(normalized) ||
          track.artist.toLowerCase().includes(normalized) ||
          track.album.toLowerCase().includes(normalized),
      ) ?? []
    )
  }, [query, tracks])

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Поиск — Sonicly</title>
        <meta
          name="description"
          content="Поиск музыки, альбомов, артистов на Sonicly. Слушайте музыку онлайн бесплатно."
        />
        <link rel="canonical" href="https://sonicly.com/search" />
        <meta property="og:title" content="Поиск — Sonicly" />
        <meta property="og:description" content="Поиск музыки, альбомов и артистов на Sonicly." />
        <meta property="og:url" content="https://sonicly.com/search" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <h1 className="text-3xl font-bold mb-8 transition-spring">{t('search')}</h1>

      <div className="max-w-4xl mx-auto">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-accent transition-spring"
        />

        {query.trim() ? (
          results.length > 0 ? (
            <ul className="mt-8 space-y-2">
              {results.map((track) => (
                <li
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-xl glass border border-white/5 hover:bg-white/5 transition-spring"
                >
                  <CoverImage
                    src={track.coverUrl}
                    alt={track.title}
                    className="size-12 rounded-lg object-cover"
                    width={96}
                    height={96}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.artist} — {track.album}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-gray-500">{t('errorEmptySearch')}</p>
          )
        ) : (
          <p className="mt-8 text-center text-gray-500">{t('errorEmptySearch')}</p>
        )}
      </div>
    </div>
  )
}
