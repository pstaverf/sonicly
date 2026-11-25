import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAlbum } from '../api'
import { SectionHeader } from '../components/SectionHeader'
import { Seo } from '../components/Seo'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { formatDate } from '../lib/format'

const AlbumPage = () => {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const album = useAlbum(slug)
  const { vibrate, patterns } = useHaptics()
  const setPlaying = useStore((state) => state.setPlaying)
  const playNow = useStore((state) => state.playNow)

  const tracks = useMemo(() => album.data?.tracks ?? [], [album.data])

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    vibrate(patterns.medium)
    playNow(tracks[0], tracks)
    setPlaying(true)
  }

  if (album.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <SkeletonRows count={8} />
      </div>
    )
  }

  if (album.isError || !album.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={t('album.notFound')} onRetry={() => album.refetch()} />
      </div>
    )
  }

  const { album: record, tracks: albumTracks } = album.data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: record.title,
    byArtist: {
      '@type': 'MusicGroup',
      name: record.artistName,
    },
    numTracks: albumTracks.length,
    image: record.coverUrl,
    datePublished: record.releaseDate,
    url: record.shareUrl,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo
        title={`${record.title} — ${record.artistName}`}
        description={`${record.title} — ${record.artistName}. ${albumTracks.length} ${t('library.trackCount')}.`}
        path={`/album/${slug}`}
        image={record.coverUrl || undefined}
        type="music.album"
        breadcrumbs={[
          { name: t('nav.home'), path: '/' },
          { name: t('album.title'), path: `/album/${slug}` },
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
          <p className="text-xs uppercase tracking-wider text-muted">{t('album.title')}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {record.title}
          </h1>
          <p className="mt-2 text-muted">{record.artistName}</p>
          <p className="text-sm text-muted">
            {t('album.released')}:{' '}
            {record.releaseDate ? formatDate(record.releaseDate) : '—'}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {albumTracks.length} {t('library.trackCount')}
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={albumTracks.length === 0}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90 disabled:opacity-40"
            >
              {t('playlist.playAll')}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader title={t('album.tracks')} />
        {albumTracks.length === 0 ? (
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        ) : (
          <div className="space-y-1">
            {albumTracks.map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={albumTracks}
                index={index}
                variant="list"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t('album.license')} />
        <ul className="space-y-1">
          {albumTracks.map((track) => (
            <li
              key={`license-${track.id}`}
              className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm transition-spring hover:bg-white/5"
            >
              <span className="truncate">{track.title}</span>
              {track.licenseUrl ? (
                <a
                  href={track.licenseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="shrink-0 text-accent transition-spring hover:opacity-80"
                >
                  {track.licenseLabel ?? track.licenseUrl}
                </a>
              ) : (
                <span className="shrink-0 text-muted">{track.licenseLabel ?? '—'}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default AlbumPage
