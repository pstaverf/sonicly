import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useTrack } from '../api'
import { ErrorState, SkeletonRows } from '../components/States'
import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { copyToClipboard } from '../lib/clipboard'
import { formatCount, formatDate, formatDuration } from '../lib/format'
import { absoluteUrl } from '../lib/seo'
import { IconSwap } from '../components/motion/IconSwap'
import { Seo } from '../components/Seo'

const TrackPage = () => {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const track = useTrack(slug)
  const { vibrate, patterns } = useHaptics()

  const currentTrack = useStore((state) => state.currentTrack)
  const isPlaying = useStore((state) => state.isPlaying)
  const likedTracks = useStore((state) => state.likedTracks)
  const setTrack = useStore((state) => state.setTrack)
  const setPlaying = useStore((state) => state.setPlaying)
  const toggleLike = useStore((state) => state.toggleLike)

  const [copied, setCopied] = useState(false)
  const data = track.data
  const isLiked = data ? likedTracks.some((item) => item.id === data.id) : false
  const isCurrent = data ? currentTrack?.id === data.id : false

  if (track.isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <SkeletonRows count={4} />
      </div>
    )
  }

  if (track.isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={t('error.notFound')} onRetry={() => track.refetch()} />
      </div>
    )
  }

  const handlePlay = () => {
    vibrate(patterns.medium)

    // The queue of the visitor is kept when the track stands in it, so a
    // track that plays does not throw the rest of the queue away.
    const queue = useStore.getState().queue
    const standsInTheQueue = queue.some((item) => item.id === data.id)

    setTrack(data, standsInTheQueue ? queue : [data])
    setPlaying(isCurrent ? !isPlaying : true)
  }

  const handleLike = () => {
    vibrate(patterns.medium)
    toggleLike(data)
  }

  const shareUrl = data.shareUrl || absoluteUrl(`/track/${slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: data.title,
    byArtist: {
      '@type': 'MusicGroup',
      name: data.artistName,
    },
    duration: `PT${Math.round(data.duration)}S`,
    image: data.coverUrl,
    url: shareUrl,
    genre: data.genres,
    license: data.licenseUrl ?? undefined,
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Seo
        title={`${data.title} — ${data.artistName}`}
        description={`${data.title} — ${data.artistName}. ${data.licenseLabel ?? 'Creative Commons'}.`}
        path={`/track/${slug}`}
        image={data.coverUrl || undefined}
        type="music.song"
        breadcrumbs={[
          { name: t('nav.home'), path: '/' },
          { name: data.artistName, path: `/artist/${data.artistSlug}` },
          { name: data.title, path: `/track/${slug}` },
        ]}
        jsonLd={jsonLd}
      />

      <article>
        <header className="mb-8 flex flex-col gap-6 sm:flex-row">
          {data.coverUrl && (
            <img
              src={data.coverUrl}
              alt={data.title}
              className="size-44 shrink-0 rounded-3xl object-cover shadow-2xl"
              width={352}
              height={352}
            />
          )}

          <div className="flex flex-col justify-end">
            <p className="text-xs uppercase tracking-wider text-muted">{t('track.title')}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance">{data.title}</h1>
            <p className="mt-2 text-muted">
              <Link to={`/artist/${data.artistSlug}`} className="transition-spring hover:text-accent">
                {data.artistName}
              </Link>
              {data.albumTitle && data.albumSlug && (
                <>
                  {' · '}
                  <Link to={`/album/${data.albumSlug}`} className="transition-spring hover:text-accent">
                    {data.albumTitle}
                  </Link>
                </>
              )}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className="flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-spring hover:scale-105"
                aria-label={isCurrent && isPlaying ? t('player.pause') : t('player.play')}
              >
                <IconSwap
                  state={isCurrent && isPlaying ? 'b' : 'a'}
                  iconA={<span className="text-lg">▶</span>}
                  iconB={<span className="text-lg">⏸</span>}
                />
              </button>

              <button
                type="button"
                onClick={handleLike}
                className={`rounded-xl px-4 py-2 text-sm transition-spring ${isLiked ? 'text-accent' : 'text-muted'}`}
                aria-pressed={isLiked}
              >
                {isLiked ? '♥' : '♡'} {isLiked ? t('player.unlike') : t('player.like')}
              </button>

              <span className="text-sm text-muted tabular-nums">{formatDuration(data.duration)}</span>
            </div>
          </div>
        </header>

        {!data.streamUrl && (
          <p className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {t('track.unavailable')}
          </p>
        )}

        <section className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            {t('track.details')}
          </h2>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">{t('stats.plays')}</dt>
              <dd className="text-sm font-medium tabular-nums">
                {data.plays > 0 ? formatCount(data.plays) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('stats.likes')}</dt>
              <dd className="text-sm font-medium tabular-nums">
                {data.likes > 0 ? formatCount(data.likes) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('track.released')}</dt>
              <dd className="text-sm font-medium">
                {data.releaseDate ? formatDate(data.releaseDate) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('common.source')}</dt>
              <dd className="text-sm font-medium">{t(`source.${data.source}`)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('track.license')}</dt>
              <dd className="text-sm font-medium">
                {data.licenseUrl ? (
                  <a
                    href={data.licenseUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent transition-spring hover:opacity-80"
                  >
                    {data.licenseLabel ?? t('track.openSource')}
                  </a>
                ) : (
                  (data.licenseLabel ?? '—')
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('track.genres')}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {data.genres.length === 0 ? (
                  <span className="text-sm font-medium">—</span>
                ) : (
                  data.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted"
                    >
                      {genre}
                    </span>
                  ))
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('track.mood')}</dt>
              <dd className="text-sm font-medium">{data.mood ?? '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs text-muted">{t('track.attribution')}</p>
            <p className="mt-1 text-sm">{t('track.attributionText')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-accent transition-spring hover:opacity-80"
              >
                {t('track.openSource')} →
              </a>
              <button
                type="button"
                onClick={() => {
                  void copyToClipboard(shareUrl).then((ok) => {
                    if (!ok) return
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="text-sm text-muted transition-spring hover:text-text"
              >
                {copied ? t('toast.copied') : t('common.copy')}
              </button>
            </div>
          </div>
        </section>
      </article>
    </div>
  )
}

export default TrackPage
