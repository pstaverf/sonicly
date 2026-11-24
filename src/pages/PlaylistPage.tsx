import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { usePlaylist } from '../api'
import { useTranslation } from 'react-i18next'

export const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: playlist, isLoading } = usePlaylist(id || '1')
  const { t } = useTranslation()

  if (isLoading) return <div className="p-8">Загрузка...</div>

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    "name": playlist?.title,
    "track": playlist?.tracks.map(t => ({ "@type": "MusicRecording", "name": t.title, "duration": `PT${t.duration}S` }))
  }

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>{playlist?.title} — Sonicly</title>
        <meta name="description" content={`Слушайте плейлист ${playlist?.title} на Sonicly. Музыка онлайн бесплатно.`} />
        <link rel="canonical" href={`https://sonicly.com/playlist/${id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <div className="w-full md:w-80 h-80 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 glass border border-white/10 flex items-center justify-center transition-spring">
            <span className="text-4xl">🎵</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2 transition-spring">{playlist?.title}</h1>
            <p className="text-sm text-gray-400 transition-spring">{playlist?.tracks.length} треков • {playlist?.isPublic ? 'Публичный' : 'Частный'}</p>
          </div>
        </div>

        <div className="space-y-2">
          {playlist?.tracks.map((track, index) => (
            <div key={track.id} className="flex items-center justify-between p-3 rounded-xl glass border border-white/5 hover:bg-white/5 transition-spring cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-6 text-gray-500">{index + 1}</span>
                <div>
                  <div className="font-semibold text-sm">{track.title}</div>
                  <div className="text-xs text-gray-400">{track.artist}</div>
                </div>
              </div>
              <span className="text-xs text-gray-400 tabular-nums">{Math.floor(track.duration / 60)}:{track.duration % 60 < 10 ? '0' : ''}{track.duration % 60}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
