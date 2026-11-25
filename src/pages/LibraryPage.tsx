import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { useWaveTracks } from '../api'
import { SectionHeader } from '../components/SectionHeader'
import { SlidingTabsHost } from '../components/SlidingTabsHost'
import { TrackCard } from '../components/TrackCard'
import { EmptyState, SkeletonRows } from '../components/States'
import { SuccessCheck } from '../components/motion/SuccessCheck'
import { useStore } from '../store'
import { useIntersection } from '../hooks/useIntersection'
import { useHaptics } from '../hooks/useHaptics'

const TABS = ['liked', 'wave', 'playlists', 'history'] as const

type TabId = (typeof TABS)[number]

const LibraryPage = () => {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { vibrate, patterns } = useHaptics()

  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)
  const history = useStore((state) => state.history)
  const createPlaylist = useStore((state) => state.createPlaylist)
  const renamePlaylist = useStore((state) => state.renamePlaylist)
  const deletePlaylist = useStore((state) => state.deletePlaylist)
  const clearHistory = useStore((state) => state.clearHistory)

  // The address holds the open tab, so a link to the library opens the tab
  // that was named, also when the library is already open.
  const wanted = params.get('tab')
  const tab: TabId =
    wanted && (TABS as readonly string[]).includes(wanted) ? (wanted as TabId) : 'liked'
  const [cleared, setCleared] = useState(false)
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [toastTrigger, setToastTrigger] = useState(0)

  const genres = useMemo(() => {
    const counts = new Map<string, number>()
    for (const track of likedTracks) {
      for (const genre of track.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)
  }, [likedTracks])

  const wave = useWaveTracks(genres)
  const waveTracks = useMemo(
    () => wave.data?.pages.flatMap((page) => page.items) ?? [],
    [wave.data],
  )

  const [sentinel, sentinelVisible] = useIntersection<HTMLDivElement>({ rootMargin: '400px' })

  useEffect(() => {
    if (!sentinelVisible) return
    if (!wave.hasNextPage) return
    if (wave.isFetchingNextPage) return
    void wave.fetchNextPage()
  }, [sentinelVisible, wave])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const tabItems = useMemo(
    () => [
      { id: 'liked', label: t('library.liked') },
      { id: 'wave', label: t('home.wave') },
      { id: 'playlists', label: t('library.playlists') },
      { id: 'history', label: t('library.history') },
    ],
    [t],
  )

  const handleTabChange = (id: string) => {
    setParams({ tab: id })
  }

  const handleCreate = () => {
    const title = playlistTitle.trim()
    if (!title) return
    vibrate(patterns.success)
    createPlaylist(title)
    setPlaylistTitle('')
    setCreating(false)
    setToast(t('toast.created'))
    setToastTrigger((value) => value + 1)
  }

  const handleRename = (id: string) => {
    const title = renameValue.trim()
    if (!title) return
    vibrate(patterns.light)
    renamePlaylist(id, title)
    setRenamingId(null)
    setRenameValue('')
  }

  const trackMap = useMemo(() => {
    const map = new Map<string, (typeof likedTracks)[number]>()
    for (const track of likedTracks) map.set(track.id, track)
    for (const track of history) map.set(track.id, track)
    return map
  }, [likedTracks, history])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass transition-reveal fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        >
          <SuccessCheck trigger={toastTrigger} />
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('library.title')}</h1>
        <SlidingTabsHost items={tabItems} value={tab} onChange={handleTabChange} />
      </div>

      {tab === 'liked' && (
        <section>
          {likedTracks.length === 0 ? (
            <EmptyState title={t('library.emptyLiked')} description={t('library.emptyLikedHint')} />
          ) : (
            <div className="space-y-1">
              {likedTracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={likedTracks}
                  index={index}
                  variant="list"
                  playlistActions
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'wave' && (
        <section>
          <SectionHeader title={t('home.wave')} description={t('home.waveDescription')} />
          {likedTracks.length === 0 ? (
            <EmptyState title={t('home.waveEmpty')} description={t('library.emptyLikedHint')} />
          ) : wave.isPending ? (
            <SkeletonRows count={6} />
          ) : (
            <>
              <div className="space-y-1">
                {waveTracks.map((track, index) => (
                  <TrackCard
                    key={`${track.id}-${index}`}
                    track={track}
                    queue={waveTracks}
                    index={index}
                    variant="list"
                  />
                ))}
              </div>
              <div ref={sentinel} className="h-8" />
              {wave.isFetchingNextPage && (
                <p className="py-4 text-center text-sm text-muted">{t('loading')}…</p>
              )}
              {!wave.hasNextPage && waveTracks.length > 0 && (
                <p className="py-4 text-center text-sm text-muted">{t('player.emptyQueue')}</p>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'playlists' && (
        <section>
          <SectionHeader title={t('library.playlists')} />
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {creating ? (
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="playlist-title">
                  {t('library.playlistName')}
                </label>
                <input
                  id="playlist-title"
                  value={playlistTitle}
                  onChange={(event) => setPlaylistTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCreate()
                  }}
                  placeholder={t('library.playlistName')}
                  className="glass rounded-xl px-4 py-2 text-sm outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-spring hover:opacity-90"
                >
                  {t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-xl px-3 py-2 text-sm text-muted transition-spring hover:text-text"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-spring hover:opacity-90"
              >
                + {t('library.createPlaylist')}
              </button>
            )}
          </div>

          {playlists.length === 0 ? (
            <EmptyState
              title={t('library.emptyPlaylists')}
              description={t('library.createPlaylist')}
            />
          ) : (
            <ul className="space-y-2">
              {playlists.map((playlist) => {
                const tracks = playlist.trackIds
                  .map((id) => trackMap.get(id))
                  .filter((track): track is NonNullable<typeof track> => Boolean(track))

                return (
                  <li key={playlist.id} className="glass rounded-2xl px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {renamingId === playlist.id ? (
                          <div className="flex items-center gap-2">
                            <label className="sr-only" htmlFor={`rename-${playlist.id}`}>
                              {t('library.playlistName')}
                            </label>
                            <input
                              id={`rename-${playlist.id}`}
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') handleRename(playlist.id)
                              }}
                              className="glass rounded-lg px-3 py-1 text-sm outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleRename(playlist.id)}
                              className="rounded-lg px-2 py-1 text-xs text-accent transition-spring hover:opacity-80"
                            >
                              {t('common.save')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="truncate font-semibold">{playlist.title}</p>
                            <p className="text-xs text-muted tabular-nums">
                              {playlist.trackIds.length} {t('library.trackCount')}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(playlist.id)
                            setRenameValue(playlist.title)
                          }}
                          className="text-xs text-muted transition-spring hover:text-text"
                          aria-label={`${t('library.renamePlaylist')}: ${playlist.title}`}
                        >
                          {t('common.rename')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            vibrate(patterns.error)
                            deletePlaylist(playlist.id)
                          }}
                          className="text-xs text-muted transition-spring hover:text-red-400"
                          aria-label={`${t('library.deletePlaylist')}: ${playlist.title}`}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>

                    {tracks.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {tracks.map((track) => (
                          <TrackCard key={track.id} track={track} queue={tracks} variant="list" />
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section>
          <SectionHeader
            title={t('library.history')}
            action={
              history.length > 0
                ? { label: t('library.clearHistory'), to: '/library?tab=history' }
                : undefined
            }
            onAction={
              history.length > 0
                ? () => {
                    vibrate(patterns.error)
                    clearHistory()
                    setCleared(true)
                  }
                : undefined
            }
          />
          {history.length === 0 ? (
            <EmptyState
              title={cleared ? t('library.historyCleared') : t('empty.title')}
              description={t('empty.description')}
            />
          ) : (
            <div className="space-y-1">
              {history.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={history}
                  index={index}
                  variant="list"
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default LibraryPage
