import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAlbums, useArtists, useChart, useNewReleases, usePlaylistsOfDay, usePopular } from '../api'
import { genres } from '../api/genres'
import { CoverCard } from '../components/CoverCard'
import { SectionHeader } from '../components/SectionHeader'
import { Seo } from '../components/Seo'
import { SlidingTabsHost } from '../components/SlidingTabsHost'
import { TrackCard } from '../components/TrackCard'
import { ErrorState, SkeletonGrid } from '../components/States'
import { SkeletonReveal } from '../components/motion/SkeletonReveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { useStore } from '../store'

const TABS = ['new', 'popular', 'chart', 'genres', 'playlists', 'albums', 'artists'] as const

type HomeTab = (typeof TABS)[number]

const isHomeTab = (id: string): id is HomeTab => (TABS as readonly string[]).includes(id)

const HomePage = () => {
  const { t } = useTranslation()
  const likedTracks = useStore((state) => state.likedTracks)
  const [tab, setTab] = useState<HomeTab>('new')

  const newReleases = useNewReleases()
  const popular = usePopular()
  const chart = useChart()
  const playlists = usePlaylistsOfDay()
  const albums = useAlbums()
  const artists = useArtists()

  const tabItems = useMemo(
    () => [
      { id: 'new', label: t('home.newReleases') },
      { id: 'popular', label: t('home.popular') },
      { id: 'chart', label: t('home.chart') },
      { id: 'genres', label: t('home.genres') },
      { id: 'playlists', label: t('home.playlistsOfDay') },
      { id: 'albums', label: t('home.albums') },
      { id: 'artists', label: t('home.artists') },
    ],
    [t],
  )

  const likedGenres = useMemo(() => {
    const counts = new Map<string, number>()
    for (const track of likedTracks) {
      for (const genre of track.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre)
  }, [likedTracks])

  const error = newReleases.error ?? popular.error ?? chart.error

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo
        title={t('home.title')}
        description={t('home.description')}
        path="/"
        type="website"
      />
      <section className="transition-reveal mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t('home.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted text-balance">{t('home.description')}</p>
      </section>

      <div className="mb-8">
        <SlidingTabsHost
          items={tabItems}
          value={tab}
          onChange={(id) => {
            if (isHomeTab(id)) setTab(id)
          }}
          label={t('home.title')}
          scrollable
        />
      </div>

      {error && (
        <div className="mb-10">
          <ErrorState message={(error as Error).message} onRetry={() => newReleases.refetch()} />
        </div>
      )}

      {tab === 'new' && (
        <section id="panel-new" role="tabpanel" aria-labelledby="tab-new">
          <SectionHeader title={t('home.newReleases')} />
          <SkeletonReveal
            loading={newReleases.isPending}
            skeleton={<SkeletonGrid count={6} />}
          >
            {newReleases.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {newReleases.data.map((track) => (
                  <TrackCard key={track.id} track={track} queue={newReleases.data} />
                ))}
              </div>
            )}
          </SkeletonReveal>
        </section>
      )}

      {tab === 'popular' && (
        <section id="panel-popular" role="tabpanel" aria-labelledby="tab-popular">
          <SectionHeader title={t('home.popular')} />
          <SkeletonReveal
            loading={popular.isPending}
            skeleton={<SkeletonGrid count={6} />}
          >
            {popular.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {popular.data.map((track) => (
                  <TrackCard key={track.id} track={track} queue={popular.data} />
                ))}
              </div>
            )}
          </SkeletonReveal>
        </section>
      )}

      {tab === 'chart' && (
        <section id="panel-chart" role="tabpanel" aria-labelledby="tab-chart">
          <SectionHeader title={t('home.chart')} />
          <SkeletonReveal loading={chart.isPending} skeleton={<SkeletonGrid count={5} />}>
            {chart.data && (
              <Stagger className="space-y-1">
                {chart.data.map((track, index) => (
                  <StaggerItem key={track.id} index={index}>
                    <TrackCard
                      track={track}
                      queue={chart.data}
                      index={index}
                      variant="list"
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </SkeletonReveal>
        </section>
      )}

      {tab === 'genres' && (
        <section id="panel-genres" role="tabpanel" aria-labelledby="tab-genres">
          <SectionHeader title={t('home.genres')} />
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Link
                key={genre.slug}
                to={`/genre/${genre.slug}`}
                className="glass transition-spring rounded-full px-4 py-2 text-sm transition-spring hover:border-accent/40 hover:text-accent"
              >
                {genre.label}
              </Link>
            ))}
          </div>
          {likedGenres.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              {t('home.waveDescription')}: {likedGenres.slice(0, 5).join(', ')}
            </p>
          )}
        </section>
      )}

      {tab === 'playlists' && (
        <section id="panel-playlists" role="tabpanel" aria-labelledby="tab-playlists">
          <SectionHeader
            title={t('home.playlistsOfDay')}
            action={{ label: t('home.explore'), to: '/search' }}
          />
          <SkeletonReveal
            loading={playlists.isPending}
            skeleton={<SkeletonGrid count={6} />}
          >
            {playlists.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {playlists.data.map((playlist) => (
                  <CoverCard
                    key={playlist.id}
                    kind="playlist"
                    title={playlist.title}
                    subtitle={playlist.author}
                    to={`/playlist/${playlist.slug}`}
                    coverUrl={playlist.coverUrl}
                    meta={
                      playlist.trackCount > 0
                        ? `${playlist.trackCount} ${t('library.trackCount')}`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </SkeletonReveal>
        </section>
      )}

      {tab === 'albums' && (
        <section id="panel-albums" role="tabpanel" aria-labelledby="tab-albums">
          <SectionHeader title={t('home.albums')} />
          <SkeletonReveal loading={albums.isPending} skeleton={<SkeletonGrid count={6} />}>
            {albums.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {albums.data.map((album) => (
                  <CoverCard
                    key={album.id}
                    kind="album"
                    title={album.title}
                    subtitle={album.artistName}
                    to={`/album/${album.slug}`}
                    coverUrl={album.coverUrl}
                    meta={album.releaseDate.slice(0, 4)}
                  />
                ))}
              </div>
            )}
          </SkeletonReveal>
        </section>
      )}

      {tab === 'artists' && (
        <section id="panel-artists" role="tabpanel" aria-labelledby="tab-artists">
          <SectionHeader title={t('home.artists')} />
          <SkeletonReveal loading={artists.isPending} skeleton={<SkeletonGrid count={6} />}>
            {artists.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {artists.data.map((artist) => (
                  <CoverCard
                    key={artist.id}
                    kind="artist"
                    title={artist.name}
                    subtitle={t('artist.topTracks')}
                    to={`/artist/${artist.slug}`}
                    coverUrl={artist.imageUrl}
                  />
                ))}
              </div>
            )}
          </SkeletonReveal>
        </section>
      )}
    </div>
  )
}

export default HomePage
