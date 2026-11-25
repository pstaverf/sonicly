import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { usePlaylist } from '../api'
import { SectionHeader } from '../components/SectionHeader'
import { Seo } from '../components/Seo'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'

const PlaylistPage = () => {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const playlist = usePlaylist(slug)
  const { vibrate, patterns } = useHaptics()
  const playNow = useStore((state) => state.playNow)
  const setPlaying = useStore((state) => state.setPlaying)

  const tracks = useMemo(() => playlist.data?.tracks ?? [], [playlist.data])

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    vibrate(patterns.medium)
    playNow(tracks[0], tracks)
    setPlaying(true)
  }

  if (playlist.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <SkeletonRows count={8} />
      </div>
    )
  }

  if (playlist.isError || !playlist.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={t('playlist.notFound')} onRetry={() => playlist.refetch()} />
      </div>
    )
  }

  const { playlist: record, tracks: playlistTracks } = playlist.data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: record.title,
    numTracks: playlistTracks.length,
    image: record.coverUrl,
    url: record.shareUrl,
    creator: {
      '@type': 'Person',
      name: record.author,
    },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo
        title={`${record.title} — ${record.author}`}
        description={`${record.title} — ${t('playlist.by')} ${record.author}. ${playlistTracks.length} ${t('library.trackCount')}.`}
        path={`/playlist/${slug}`}
        image={record.coverUrl || undefined}
        type="music.playlist"
        breadcrumbs={[
          { name: t('nav.home'), path: '/' },
          { name: t('playlist.title'), path: `/playlist/${slug}` },
        ]}
        jsonLd={jsonLd}
      />
      <section className="mb-8 flex flex-col gap-6 sm:flex-row">
        {record.coverUrl && (
          <img
            src={record.coverUrl}
            alt={record.title}
            className="size-40 shrink-0 rounded-2xl object-cover shadow-2xl sm:size-56"
            width={448}
            height={448}
          />
        )}

        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-wider text-muted">{t('playlist.title')}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {record.title}
          </h1>
          <p className="mt-2 text-muted">
            {t('playlist.by')} {record.author}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {playlistTracks.length} {t('library.trackCount')}
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={playlistTracks.length === 0}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90 disabled:opacity-40"
            >
              {t('playlist.playAll')}
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title={t('playlist.tracks')} />
        {playlistTracks.length === 0 ? (
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        ) : (
          <div className="space-y-1">
            {playlistTracks.map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={playlistTracks}
                index={index}
                variant="list"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PlaylistPage
