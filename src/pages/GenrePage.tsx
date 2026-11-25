import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useGenreTracks } from '../api'
import { genreBySlug } from '../api/genres'
import { SectionHeader } from '../components/SectionHeader'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, ErrorState, SkeletonRows } from '../components/States'
import { Seo } from '../components/Seo'
import { buildCollectionPage, buildMusicItemList, SITE_NAME } from '../lib/seo'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { useIntersection } from '../hooks/useIntersection'

const GenrePage = () => {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const genre = genreBySlug(slug)
  const { vibrate, patterns } = useHaptics()
  const playNow = useStore((state) => state.playNow)
  const setPlaying = useStore((state) => state.setPlaying)

  const tracks = useGenreTracks(genre?.tag ?? '')

  const items = useMemo(() => tracks.data?.pages.flatMap((page) => page.items) ?? [], [tracks.data])
  const [sentinelRef, sentinelVisible] = useIntersection<HTMLDivElement>({ rootMargin: '400px' })

  useEffect(() => {
    if (!sentinelVisible) return
    if (!tracks.hasNextPage) return
    if (tracks.isFetchingNextPage) return
    void tracks.fetchNextPage()
  }, [sentinelVisible, tracks])

  const handlePlayAll = () => {
    if (items.length === 0) return
    vibrate(patterns.medium)
    playNow(items[0], items)
    setPlaying(true)
  }

  if (!genre) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={t('genre.notFound')} onRetry={() => undefined} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo
        title={genre.label}
        description={`${genre.label} — ${t('home.description')}`}
        path={`/genre/${slug}`}
        breadcrumbs={[
          { name: SITE_NAME, path: '/' },
          { name: t('genre.title'), path: '/genre/pop' },
          { name: genre.label, path: `/genre/${slug}` },
        ]}
        jsonLd={[
          buildCollectionPage(genre.label, `${genre.label} — ${t('home.description')}`, `/genre/${slug}`),
          buildMusicItemList(
            items.map((track) => ({
              title: track.title,
              slug: track.slug,
              artistName: track.artistName,
              duration: track.duration,
              coverUrl: track.coverUrl,
              releaseDate: track.releaseDate,
              shareUrl: track.shareUrl,
            })),
            genre.label,
          ),
        ]}
      />

      <section className="transition-reveal mb-8">
        <p className="text-xs uppercase tracking-wider text-muted">{t('genre.title')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {genre.label}
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handlePlayAll}
            className="mt-5 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90"
          >
            {t('playlist.playAll')}
          </button>
        )}
      </section>

      <section>
        <SectionHeader title={t('search.tracks')} />
        {tracks.isPending ? (
          <SkeletonRows count={8} />
        ) : tracks.isError ? (
          <ErrorState message={(tracks.error as Error).message} onRetry={() => tracks.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title={t('search.empty')} description={t('search.emptyHint')} />
        ) : (
          <div className="space-y-1">
            {items.map((track, index) => (
              <TrackCard
                key={`${track.id}-${index}`}
                track={track}
                queue={items}
                index={index}
                variant="list"
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-8" />
        {tracks.isFetchingNextPage && (
          <p className="py-4 text-center text-sm text-muted">{t('loading')}…</p>
        )}
      </section>
    </div>
  )
}

export default GenrePage
