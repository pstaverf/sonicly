import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAlbums, useArtists, useChart, useNewReleases, usePlaylistsOfDay, usePopular } from '../api'
import { genres } from '../api/genres'
import { CoverCard } from '../components/CoverCard'
import { SectionHeader } from '../components/SectionHeader'
import { Seo } from '../components/Seo'
import { TrackCard } from '../components/TrackCard'
import { ErrorState, SkeletonGrid } from '../components/States'
import { useStore } from '../store'

const HomePage = () => {
  const { t } = useTranslation()
  const likedTracks = useStore((state) => state.likedTracks)

  const newReleases = useNewReleases()
  const popular = usePopular()
  const chart = useChart()
  const playlists = usePlaylistsOfDay()
  const albums = useAlbums()
  const artists = useArtists()

  const prefetch = useMemo(() => () => undefined, [])

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
      <section className="transition-reveal mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t('home.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted text-balance">{t('home.description')}</p>
      </section>

      {error && (
        <div className="mb-10">
          <ErrorState message={(error as Error).message} onRetry={() => newReleases.refetch()} />
        </div>
      )}

      <section className="mb-12">
        <SectionHeader title={t('home.newReleases')} />
        {newReleases.isPending ? (
          <SkeletonGrid count={6} />
        ) : newReleases.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {newReleases.data.map((track) => (
              <TrackCard key={track.id} track={track} queue={newReleases.data} onPrefetch={prefetch} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mb-12">
        <SectionHeader title={t('home.popular')} />
        {popular.isPending ? (
          <SkeletonGrid count={6} />
        ) : popular.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {popular.data.map((track) => (
              <TrackCard key={track.id} track={track} queue={popular.data} onPrefetch={prefetch} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mb-12">
        <SectionHeader title={t('home.chart')} />
        {chart.isPending ? (
          <SkeletonGrid count={5} />
        ) : chart.data ? (
          <div className="space-y-1">
            {chart.data.map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={chart.data}
                index={index}
                variant="list"
                onPrefetch={prefetch}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mb-12">
        <SectionHeader title={t('home.genres')} />
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <a
              key={genre.slug}
              href={`/genre/${genre.slug}`}
              className="glass transition-spring rounded-full px-4 py-2 text-sm transition-spring hover:border-accent/40 hover:text-accent"
            >
              {genre.label}
            </a>
          ))}
        </div>
        {likedGenres.length > 0 && (
          <p className="mt-4 text-xs text-muted">
            {t('home.waveDescription')}: {likedGenres.slice(0, 5).join(', ')}
          </p>
        )}
      </section>

      <section className="mb-12">
        <SectionHeader
          title={t('home.playlistsOfDay')}
          action={{ label: t('home.explore'), to: '/search' }}
        />
        {playlists.isPending ? (
          <SkeletonGrid count={6} />
        ) : playlists.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {playlists.data.map((playlist) => (
              <CoverCard
                key={playlist.id}
                kind="playlist"
                title={playlist.title}
                subtitle={playlist.author}
                to={`/playlist/${playlist.slug}`}
                coverUrl={playlist.coverUrl}
                meta={`${playlist.trackCount} ${t('library.trackCount')}`}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mb-12">
        <SectionHeader title={t('home.albums')} />
        {albums.isPending ? (
          <SkeletonGrid count={6} />
        ) : albums.data ? (
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
        ) : null}
      </section>

      <section className="mb-12">
        <SectionHeader title={t('home.artists')} />
        {artists.isPending ? (
          <SkeletonGrid count={6} />
        ) : artists.data ? (
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
        ) : null}
      </section>
    </div>
  )
}

export default HomePage
