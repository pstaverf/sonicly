import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'

export const LibraryPage = () => {
  const { t } = useTranslation()
  const { likedTracks, playlists, user } = useStore()

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>Моя коллекция — Sonicly</title>
        <meta name="description" content="Ваша коллекция музыки, лайки и плейлисты на Sonicly." />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://sonicly.com/library" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-8 transition-spring">
        {t('library')}
      </h1>
      
      {!user?.isGuest && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 mb-8 transition-spring">
          <h2 className="text-xl font-bold mb-2">Синхронизация</h2>
          <p className="text-sm text-gray-400">Ваши данные сохранены в аккаунте.</p>
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 transition-spring">Лайки</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {likedTracks.map((track) => (
            <div key={track.id} className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105">
              <img src={track.coverUrl} alt={track.title} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 transition-spring">Плейлисты</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="rounded-2xl overflow-hidden glass border border-white/10 transition-spring hover:scale-105">
              <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500">🎵</span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{playlist.title}</h3>
                <p className="text-xs text-gray-400">{playlist.tracks.length} треков</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
