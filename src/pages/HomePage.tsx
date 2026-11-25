import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

import { useTracks } from '../api'
import { CoverImage } from '../components/CoverImage'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Sonicly',
  url: 'https://sonicly.com/',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://sonicly.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Sonicly',
    logo: 'https://sonicly.com/favicon.svg',
  },
}

export const HomePage = () => {
  const { t } = useTranslation()
  const { data: tracks, isLoading } = useTracks()

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Sonicly: слушать музыку онлайн бесплатно</title>
        <meta
          name="description"
          content="Sonicly — слушать музыку онлайн бесплатно, плейлисты, новинки, чарты. Музыка без регистрации."
        />
        <meta
          name="keywords"
          content="sonicly, музыка, слушать музыку, слушать музыку онлайн, музыка без регистрации, плейлисты, чарты, новинки, music streaming"
        />
        <link rel="canonical" href="https://sonicly.com/" />
        <meta property="og:title" content="Sonicly: слушать музыку онлайн бесплатно" />
        <meta
          property="og:description"
          content="Sonicly — слушать музыку онлайн бесплатно, плейлисты, новинки, чарты."
        />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://sonicly.com/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4 transition-spring">
        {t('welcome')}
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl transition-spring">
        {t('description')}
      </p>

      <section>
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('wave')}</h2>
        {isLoading ? (
          <div className="shimmer-text text-2xl font-bold animate-pulse">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracks?.slice(0, 4).map((track) => (
              <article
                key={track.id}
                className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105"
              >
                <CoverImage
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-48 object-cover"
                  width={480}
                  height={480}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('newReleases')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tracks?.slice(4, 9).map((track) => (
            <article
              key={track.id}
              className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105"
            >
              <CoverImage
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-48 object-cover"
                width={480}
                height={480}
              />
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                <p className="text-xs text-gray-400 truncate">{track.album}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('charts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((column) => (
            <ol
              key={column}
              className="space-y-2 rounded-2xl glass border border-white/10 transition-spring p-4"
            >
              {tracks?.slice(column * 5, column * 5 + 5).map((track, index) => (
                <li key={track.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-gray-400 tabular-nums">{index + 1}.</span>
                  <span className="flex-1 truncate">{track.title}</span>
                  <span className="text-gray-500 truncate">{track.artist}</span>
                </li>
              ))}
            </ol>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('genres')}</h2>
        <div className="flex flex-wrap gap-3">
          {['Pop', 'Rock', 'Jazz', 'Electronic', 'Indie', 'Folk'].map((genre) => (
            <a
              key={genre}
              href={`/search?genre=${genre}`}
              className="px-4 py-2 rounded-xl glass border border-white/10 text-sm hover:text-accent transition-spring"
            >
              {genre}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
