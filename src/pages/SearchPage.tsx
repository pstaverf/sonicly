import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useSearch } from '../api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CoverCard } from '../components/CoverCard'
import { SectionHeader } from '../components/SectionHeader'
import { SlidingTabsHost } from '../components/SlidingTabsHost'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, ErrorState, SkeletonGrid, SkeletonRows } from '../components/States'
import { Seo } from '../components/Seo'

type TabId = 'tracks' | 'albums' | 'artists' | 'playlists'

const SearchPage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>('tracks')

  // The word lives in the address, so a search can be shared and the button
  // of the browser walks through the words that were looked for.
  const term = searchParams.get('q') ?? ''

  const setTerm = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value.trim().length > 0) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const debounced = useDebouncedValue(term, 300)

  const search = useSearch(debounced)

  const tabItems = useMemo(
    () => [
      { id: 'tracks', label: t('search.tracks') },
      { id: 'albums', label: t('search.albums') },
      { id: 'artists', label: t('search.artists') },
      { id: 'playlists', label: t('search.playlists') },
    ],
    [t],
  )

  const results = search.data
  const counts = {
    tracks: results?.tracks.length ?? 0,
    albums: results?.albums.length ?? 0,
    artists: results?.artists.length ?? 0,
    playlists: results?.playlists.length ?? 0,
  }

  const isEmpty =
    search.isSuccess &&
    counts.tracks + counts.albums + counts.artists + counts.playlists === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Seo title={t('search.title')} description={t('home.description')} path="/search" />

      <h1 className="mb-4 text-2xl font-bold tracking-tight">{t('search.title')}</h1>

      <label className="sr-only" htmlFor="search-input">
        {t('search.title')}
      </label>
      <input
        id="search-input"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={t('search.placeholder')}
        autoComplete="off"
        className="glass w-full rounded-2xl px-5 py-3 text-sm outline-none placeholder:text-muted"
      />

      {debounced.trim().length === 0 && (
        <div className="mt-12">
          <EmptyState title={t('search.start')} description={t('home.description')} />
        </div>
      )}

      {debounced.trim().length > 0 && (
        <div className="mt-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <SlidingTabsHost items={tabItems} value={tab} onChange={(id) => setTab(id as TabId)} />
            {search.isFetching && (
              <span className="text-xs text-muted">{t('loading')}…</span>
            )}
          </div>

          {search.isError && (
            <ErrorState message={(search.error as Error).message} onRetry={() => search.refetch()} />
          )}

          {search.isPending && (
            <div className="space-y-8">
              <SkeletonRows count={6} />
              <SkeletonGrid count={6} />
            </div>
          )}

          {isEmpty && <EmptyState title={t('search.empty')} description={t('search.emptyHint')} />}

          {results && tab === 'tracks' && (
            <section>
              <SectionHeader title={`${t('search.tracks')} · ${counts.tracks}`} />
              <div className="space-y-1">
                {results.tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    queue={results.tracks}
                    index={index}
                    variant="list"
                  />
                ))}
              </div>
            </section>
          )}

          {results && tab === 'albums' && (
            <section>
              <SectionHeader title={`${t('search.albums')} · ${counts.albums}`} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {results.albums.map((album) => (
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
            </section>
          )}

          {results && tab === 'artists' && (
            <section>
              <SectionHeader title={`${t('search.artists')} · ${counts.artists}`} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {results.artists.map((artist) => (
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
            </section>
          )}

          {results && tab === 'playlists' && (
            <section>
              <SectionHeader title={`${t('search.playlists')} · ${counts.playlists}`} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {results.playlists.map((playlist) => (
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
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage
