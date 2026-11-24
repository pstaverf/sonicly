import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { useAlbum } from '../api'
import { useTranslation } from 'react-i18next'

export const AlbumPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: album, isLoading } = useAlbum(id || '1')
  const { t } = useTranslation()

  if (isLoading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>{album?.title} — {album?.artist} — Sonicly</title>
        <meta name="description" content={`Слушайте альбом ${album?.title} от ${album?.artist} на Sonicly. Музыка онлайн бесплатно.`} />
        <link rel="canonical" href={`https://sonicly.com/album/${id}`} />
        <script type="application/ld+json">
{`{
  "@context": "https://schema.org",
  "@type": "MusicAlbum",
  "name": "${album?.title}",
  "artist": { "@type": "MusicGroup", "name": "${album?.artist}" },
  "releaseYear": ${album?.releaseYear},
  "track": ${JSON.stringify(album?.tracks.map(t => ({ "@type": "MusicRecording", "name": t.title, "duration": `PT${t.duration}S` }))}
}`}
        </script>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <img src={album?.coverUrl} alt={album?.title} className="w-full md:w-80 h-80 rounded-2xl object-cover shadow-2xl transition-spring" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 transition-spring">{album?.title}</h1>
            <h2 className="text-xl text-gray-400 mb-6 transition-spring">{album?.artist}</h2>
            <p className="text-sm text-gray-400 mb-8 transition-spring">{album?.releaseYear} • {album?.tracks.length} треков</p>
            
            <div className="space-y-2">
              {album?.tracks.map((track, index) => (
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
      </div>
    </div>
  )
}
