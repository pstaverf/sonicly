import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { usePlaylist } from '../api'
import { useStore } from '../store'

export const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { data: playlist, isLoading } = usePlaylist(id ?? '1')
  const setTrack = useStore((state) => state.setTrack)
  const setQueue = useStore((state) => state.setQueue)
  const togglePlay = useStore((state) => state.togglePlay)
  const currentTrack = useStore((state) => state.currentTrack)

  if (isLoading) return <div className="p-8">{t('loading')}</div>

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: playlist?.title,
    track: playlist?.tracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      duration: `PT${track.duration}S`,
    })),
  }

  const handlePlay = (trackId: string) => {
    const track = playlist?.tracks.find((item) => item.id === trackId)
    if (!track) return
    if (currentTrack?.id === track.id) {
      togglePlay()
      return
    }
    setQueue(playlist?.tracks ?? [])
    setTrack(track)
    useStore.setState({ isPlaying: true })
  }

  return (
    <div className="p-4 md:p-8">
      <Helmet>
        <title>
          {playlist?.title} — Sonicly
        </title>
        <meta
          name="description"
          content={`Слушайте плейлист ${playlist?.title} на Sonicly. Музыка онлайн бесплатно.`}
        />
        <link rel="canonical" href={`https://sonicly.com/playlist/${id}`} />
        <meta property="og:title" content={`${playlist?.title} — Sonicly`} />
        <meta
          property="og:description"
          content={`Слушайте плейлист ${playlist?.title} на Sonicly.`}
        />
        <meta property="og:url" content={`https://sonicly.com/playlist/${id}`} />
        <meta property="og:type" content="music.playlist" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <div className="w-full md:w-80 h-80 rounded-2xl bg-linear-to-br from-accent/20 to-accent/5 glass border border-white/10 flex items-center justify-center transition-spring">
            <span className="text-4xl" aria-hidden="true">
              🎵
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2 transition-spring">{playlist?.title}</h1>
            <p className="text-sm text-gray-400 transition-spring">
              {playlist?.tracks.length} треков •{' '}
              {playlist?.isPublic ? 'Публичный' : 'Частный'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {playlist?.tracks.map((track, index) => (
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
  )
}
