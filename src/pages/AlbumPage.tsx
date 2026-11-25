import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAlbum } from '../api'
import { useStore } from '../store'
import { CoverImage } from '../components/CoverImage'

export const AlbumPage = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { data: album, isLoading } = useAlbum(id ?? '1')
  const setTrack = useStore((state) => state.setTrack)
  const setQueue = useStore((state) => state.setQueue)
  const togglePlay = useStore((state) => state.togglePlay)
  const currentTrack = useStore((state) => state.currentTrack)

  if (isLoading) return <div className="p-8">{t('loading')}</div>

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album?.title,
    artist: { '@type': 'MusicGroup', name: album?.artist },
    releaseYear: album?.releaseYear,
    track: album?.tracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      duration: `PT${track.duration}S`,
    })),
  }

  const handlePlay = (trackId: string) => {
    const track = album?.tracks.find((item) => item.id === trackId)
    if (!track) return
    if (currentTrack?.id === track.id) {
      togglePlay()
      return
    }
    setQueue(album?.tracks ?? [])
    setTrack(track)
    useStore.setState({ isPlaying: true })
  }

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>
          {album?.title} — {album?.artist} — Sonicly
        </title>
        <meta
          name="description"
          content={`Слушайте альбом ${album?.title} от ${album?.artist} на Sonicly. Музыка онлайн бесплатно.`}
        />
        <link rel="canonical" href={`https://sonicly.com/album/${id}`} />
        <meta property="og:title" content={`${album?.title} — ${album?.artist} — Sonicly`} />
        <meta
          property="og:description"
          content={`Слушайте альбом ${album?.title} от ${album?.artist} на Sonicly.`}
        />
        <meta property="og:url" content={`https://sonicly.com/album/${id}`} />
        <meta property="og:type" content="music.album" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <CoverImage
            src={album?.coverUrl ?? ''}
            alt={album?.title ?? ''}
            className="w-full md:w-80 h-80 rounded-2xl object-cover shadow-2xl transition-spring"
            width={640}
            height={640}
            priority
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 transition-spring">{album?.title}</h1>
            <h2 className="text-xl text-gray-400 mb-6 transition-spring">{album?.artist}</h2>
            <p className="text-sm text-gray-400 mb-8 transition-spring">
              {album?.releaseYear} • {album?.tracks.length} треков
            </p>

            <div className="space-y-2">
              {album?.tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => handlePlay(track.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl glass border border-white/5 hover:bg-white/5 transition-spring cursor-pointer text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-gray-500 tabular-nums">{index + 1}</span>
                    <span>
                      <span className="font-semibold text-sm block">{track.title}</span>
                      <span className="text-xs text-gray-400 block">{track.artist}</span>
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {Math.floor(track.duration / 60)}:
                    {track.duration % 60 < 10 ? '0' : ''}
                    {track.duration % 60}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
