import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'
import { CoverImage } from '../components/CoverImage'

export const LibraryPage = () => {
  const { t } = useTranslation()
  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)
  const user = useStore((state) => state.user)

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Моя коллекция — Sonicly</title>
        <meta
          name="description"
          content="Ваша коллекция музыки, лайки и плейлисты на Sonicly."
        />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://sonicly.com/library" />
        <meta property="og:title" content="Моя коллекция — Sonicly" />
        <meta property="og:description" content="Ваша коллекция музыки, лайки и плейлисты на Sonicly." />
        <meta property="og:url" content="https://sonicly.com/library" />
        <meta property="og:type" content="website" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-8 transition-spring">{t('library')}</h1>

      {!user?.isGuest && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 mb-8 transition-spring">
          <h2 className="text-xl font-bold mb-2">Синхронизация</h2>
          <p className="text-sm text-gray-400">Ваши данные сохранены в аккаунте.</p>
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">Лайки</h2>
        {likedTracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {likedTracks.map((track) => (
              <article
                key={track.id}
                className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105"
              >
                <CoverImage
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-40 object-cover"
                  width={320}
                  height={320}
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{t('signInPrompt')}</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 transition-spring">{t('playlists')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <article
              key={playlist.id}
              className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105"
            >
              <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500" aria-hidden="true">
                  🎵
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{playlist.title}</h3>
                <p className="text-xs text-gray-400">{playlist.tracks.length} треков</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
