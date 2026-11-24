import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export const SearchPage = () => {
  const { t } = useTranslation()

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Поиск — Sonicly</title>
        <meta name="description" content="Поиск музыки, альбомов, артистов на Sonicly. Слушайте музыку онлайн бесплатно." />
        <link rel="canonical" href="https://sonicly.com/search" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-8 transition-spring">
        {t('search')}
      </h1>
      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-accent transition-spring"
        />
      </div>
      <div className="mt-8 text-center text-gray-500">
        {t('errorEmptySearch')}
      </div>
    </div>
  )
}
