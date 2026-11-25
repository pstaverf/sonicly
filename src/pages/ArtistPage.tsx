import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useArtist } from '../api'
import { SectionHeader } from '../components/SectionHeader'
import { Seo } from '../components/Seo'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { formatCount } from '../lib/format'

const ArtistPage = () => {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const artist = useArtist(slug)
  const { vibrate, patterns } = useHaptics()
  const playNow = useStore((state) => state.playNow)
  const setPlaying = useStore((state) => state.setPlaying)

  const tracks = useMemo(() => artist.data?.tracks ?? [], [artist.data])

  const handlePlayAll = () => {
    if (tracks.length === 0) return
    vibrate(patterns.medium)
    playNow(tracks[0], tracks)
    setPlaying(true)
  }

  if (artist.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <SkeletonRows count={8} />
      </div>
    )
  }

  if (artist.isError || !artist.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={t('artist.notFound')} onRetry={() => artist.refetch()} />
      </div>
    )
  }

  const { artist: record, tracks: artistTracks } = artist.data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: record.name,
    image: record.imageUrl,
    url: record.website ?? undefined,
    numTracks: artistTracks.length,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo
        title={record.name}
        description={`${record.name} — ${artistTracks.length} ${t('library.trackCount')}. ${t('home.description')}`}
        path={`/artist/${slug}`}
        image={record.imageUrl || undefined}
        type="profile"
        breadcrumbs={[
          { name: t('nav.home'), path: '/' },
          { name: t('artist.title'), path: `/artist/${slug}` },
        ]}
        jsonLd={jsonLd}
      />
      <section className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        {record.imageUrl ? (
          <img
            src={record.imageUrl}
            alt={record.name}
            className="size-32 shrink-0 rounded-full object-cover shadow-2xl sm:size-44"
            width={352}
            height={352}
          />
        ) : (
          <div
            className="flex size-32 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent/30 to-accent/5 text-4xl sm:size-44"
            aria-hidden="true"
          >
            👤
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{t('artist.title')}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {record.name}
          </h1>
          <p className="mt-2 text-sm text-muted tabular-nums">
            {artistTracks.length} {t('stats.tracks').toLowerCase()}
            {record.followers > 0 && ` · ${formatCount(record.followers)} ${t('artist.followers').toLowerCase()}`}
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={artistTracks.length === 0}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90 disabled:opacity-40"
            >
              {t('playlist.playAll')}
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title={t('artist.topTracks')} />
        {artistTracks.length === 0 ? (
          <EmptyState title={t('empty.title')} description={t('empty.description')} />
        ) : (
          <div className="space-y-1">
            {artistTracks.map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={artistTracks}
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

export default ArtistPage
