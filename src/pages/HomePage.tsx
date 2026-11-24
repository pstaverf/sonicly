import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useTracks } from '../api'
import { useStore } from '../store'

export const HomePage = () => {
  const { t } = useTranslation()
  const { data: tracks, isLoading } = useTracks()
  const { theme } = useStore()

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Sonicly: слушать музыку онлайн бесплатно</title>
        <meta name="description" content="Sonicly — слушать музыку онлайн бесплатно, плейлисты, новинки, чарты. Музыка без регистрации." />
        <meta name="keywords" content="sonicly, музыка, слушать музыку, слушать музыку онлайн, музыка без регистрации, плейлисты, чарты, новинки, music streaming" />
        <link rel="canonical" href="https://sonicly.com/" />
        <meta property="og:title" content="Sonicly: слушать музыку онлайн бесплатно" />
        <meta property="og:description" content="Sonicly — слушать музыку онлайн бесплатно, плейлисты, новинки, чарты." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://sonicly.com/" />
        <meta property="og:site_name" content="Sonicly" />
        <meta property="og:locale" content={theme === 'dark' ? 'ru_RU' : 'en_US'} />
        <script type="application/ld+json">
{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Sonicly",
  "url": "https://sonicly.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://sonicly.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Sonicly",
    "logo": "https://sonicly.com/favicon.svg"
  }
}`}
        </script>
      </Helmet>

      <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4 transition-spring">
        {t('welcome')}
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl transition-spring">
        {t('description')}
      </p>

      {isLoading ? (
        <div className="shimmer-text text-2xl font-bold animate-pulse">
          {t('wave')}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4 transition-spring">{t('wave')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracks?.slice(0, 4).map((track) => (
              <div key={track.id} className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105">
                <img src={track.coverUrl} alt={track.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('newReleases')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Mock carousels */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105">
              <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500">Album {i}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">Новинка {i}</h3>
                <p className="text-xs text-gray-400">Артист {i}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('charts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring p-4">
              <h3 className="font-semibold mb-2">Чарты {i}</h3>
              <ol className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-gray-400">{j}.</span>
                    <span>Трек {j} — Артист {j}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
