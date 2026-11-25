import { beforeEach, describe, expect, it } from 'vitest'

import { useStore } from '../store'
import type { Track } from '../types'

const makeTrack = (id: string, extra: Partial<Track> = {}): Track => ({
  id,
  source: 'jamendo',
  slug: `track-jamendo-${id}`,
  title: `Track ${id}`,
  artistId: 'jamendo:1',
  artistName: 'Artist',
  artistSlug: 'artist-jamendo-1',
  albumId: null,
  albumTitle: null,
  albumSlug: null,
  coverUrl: 'https://example.com/cover.jpg',
  streamUrl: 'https://example.com/stream.mp3',
  duration: 180,
  releaseDate: '2024-01-01',
  genres: ['rock'],
  licenseUrl: null,
  licenseLabel: null,
  plays: 0,
  likes: 0,
  mood: null,
  shareUrl: 'https://example.com',
  ...extra,
})

const tracks = [makeTrack('1'), makeTrack('2'), makeTrack('3')]

const reset = () => {
  useStore.setState({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    volume: 80,
    muted: false,
    shuffle: false,
    repeat: 'off',
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
    likedTracks: [],
    playlists: [],
    history: [],
    language: 'ru',
    theme: 'dark',
    hapticsEnabled: true,
    user: { id: 'guest', email: null, name: 'Гость', avatarUrl: '', isGuest: true },
  })
}

describe('sonicly store', () => {
  beforeEach(reset)

  it('starts in guest mode with dark theme and russian locale', () => {
    const state = useStore.getState()

    expect(state.user.isGuest).toBe(true)
    expect(state.theme).toBe('dark')
    expect(state.language).toBe('ru')
  })

  it('toggles playback state', () => {
    useStore.getState().togglePlay()
    expect(useStore.getState().isPlaying).toBe(true)

    useStore.getState().togglePlay()
    expect(useStore.getState().isPlaying).toBe(false)
  })

  it('adds and removes likes without duplicates', () => {
    const track = tracks[0]

    useStore.getState().toggleLike(track)
    expect(useStore.getState().likedTracks).toHaveLength(1)

    useStore.getState().toggleLike(track)
    expect(useStore.getState().likedTracks).toHaveLength(0)
  })

  it('never stores the same track twice in the library', () => {
    useStore.getState().toggleLike(tracks[0])
    useStore.getState().toggleLike(tracks[1])

    expect(useStore.getState().likedTracks.map((item) => item.id)).toEqual(['2', '1'])
  })

  it('cycles repeat mode through off, all and one', () => {
    useStore.getState().cycleRepeat()
    expect(useStore.getState().repeat).toBe('all')

    useStore.getState().cycleRepeat()
    expect(useStore.getState().repeat).toBe('one')

    useStore.getState().cycleRepeat()
    expect(useStore.getState().repeat).toBe('off')
  })

  it('advances and rewinds inside the queue', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().nextTrack()
    expect(useStore.getState().currentTrack?.id).toBe('2')
    expect(useStore.getState().queueIndex).toBe(1)

    useStore.getState().previousTrack()
    expect(useStore.getState().currentTrack?.id).toBe('1')
  })

  it('wraps around when moving before the first track', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().previousTrack()
    expect(useStore.getState().currentTrack?.id).toBe('3')
  })

  it('repeats the same track when repeat is one', () => {
    useStore.setState({ repeat: 'one' })
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().nextTrack()
    expect(useStore.getState().currentTrack?.id).toBe('1')
  })

  it('moves tracks inside the queue', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().moveInQueue(2, 0)
    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['3', '1', '2'])
    expect(useStore.getState().currentTrack?.id).toBe('1')
    expect(useStore.getState().queueIndex).toBe(1)
  })

  it('inserts a track right after the current one', () => {
    const extra = makeTrack('9')
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().playNext(extra)
    expect(useStore.getState().queue[1].id).toBe('9')
  })

  it('appends to the end of the queue', () => {
    const extra = makeTrack('9')
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().addToQueue(extra)
    expect(useStore.getState().queue.at(-1)?.id).toBe('9')
  })

  it('creates, renames and deletes local playlists', () => {
    const playlist = useStore.getState().createPlaylist('Road trip')

    useStore.getState().renamePlaylist(playlist.id, 'Evening')
    expect(useStore.getState().playlists[0].title).toBe('Evening')

    useStore.getState().addToPlaylist(playlist.id, tracks[0])
    expect(useStore.getState().playlists[0].trackIds).toEqual(['1'])

    useStore.getState().deletePlaylist(playlist.id)
    expect(useStore.getState().playlists).toHaveLength(0)
  })

  it('keeps the most recent history entries first', () => {
    useStore.getState().pushHistory(tracks[0])
    useStore.getState().pushHistory(tracks[1])

    expect(useStore.getState().history[0].id).toBe('2')

    useStore.getState().clearHistory()
    expect(useStore.getState().history).toHaveLength(0)
  })

  it('switches theme, language and haptics', () => {
    useStore.getState().setTheme('light')
    useStore.getState().setLanguage('en')
    useStore.getState().toggleHaptics()

    expect(useStore.getState().theme).toBe('light')
    expect(useStore.getState().language).toBe('en')
    expect(useStore.getState().hapticsEnabled).toBe(false)
  })

  it('signs a user in and out', () => {
    useStore.getState().login({
      id: 'u1',
      email: 'user@example.com',
      name: 'Мария',
      avatarUrl: '',
      isGuest: false,
    })
    expect(useStore.getState().user.isGuest).toBe(false)

    useStore.getState().logout()
    expect(useStore.getState().user.isGuest).toBe(true)
  })
})
