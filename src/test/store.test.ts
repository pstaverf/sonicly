import { beforeEach, describe, expect, it } from 'vitest'

import { readCurrentTrack, saveCurrentTrack, useStore } from '../store'
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
    shuffleOrder: [],
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

  it('always advances when the next button is pressed, even with repeat one', () => {
    useStore.setState({ repeat: 'one' })
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().nextTrack()
    expect(useStore.getState().currentTrack?.id).toBe('2')
    expect(useStore.getState().queueIndex).toBe(1)
  })

  it('keeps the current track in place when an earlier row is removed', () => {
    useStore.getState().setTrack(tracks[1], tracks)
    expect(useStore.getState().queueIndex).toBe(1)

    useStore.getState().removeFromQueue(0)

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['2', '3'])
    expect(useStore.getState().currentTrack?.id).toBe('2')
    expect(useStore.getState().queueIndex).toBe(0)
  })

  it('moves to the next row when the current track is removed', () => {
    useStore.getState().setTrack(tracks[1], tracks)

    useStore.getState().removeFromQueue(1)

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['1', '3'])
    expect(useStore.getState().currentTrack?.id).toBe('3')
    expect(useStore.getState().queueIndex).toBe(1)
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

  it('does not hold the same track twice when it is set to play next', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().playNext(tracks[2])

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['1', '3', '2'])
    expect(useStore.getState().queueIndex).toBe(0)
  })

  it('moves a track from the end of the queue to the next place', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().playNext(tracks[2])

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['1', '3', '2'])
  })

  it('puts a track that is not in the queue in front of it', () => {
    const other = makeTrack('9')
    useStore.getState().setTrack(other, tracks)

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['9', '1', '2', '3'])
    expect(useStore.getState().queueIndex).toBe(0)
    expect(useStore.getState().currentTrack?.id).toBe('9')
  })

  it('keeps the playing track inside the queue when the list changes', () => {
    const other = makeTrack('9')
    useStore.getState().setTrack(other, tracks)

    useStore.getState().nextTrack()

    expect(useStore.getState().currentTrack?.id).toBe('1')
    expect(useStore.getState().queueIndex).toBe(1)
  })

  it('appends to the end of the queue', () => {
    const extra = makeTrack('9')
    useStore.getState().setTrack(tracks[0], tracks)

    useStore.getState().addToQueue(extra)
    expect(useStore.getState().queue.at(-1)?.id).toBe('9')
  })

  it('keeps the track that plays through a reload', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    saveCurrentTrack(useStore.getState().currentTrack)

    expect(readCurrentTrack()?.id).toBe('1')
  })

  it('does not keep the track that plays in the store of the page', () => {
    useStore.getState().setTrack(tracks[0], tracks)

    const raw = window.localStorage.getItem('sonicly-storage')
    const parsed = JSON.parse(raw ?? '{}') as { state?: { currentTrack?: unknown } }

    // The track stands in its own place, otherwise the markup of the server
    // and the markup of the browser would differ.
    expect(parsed.state?.currentTrack).toBeUndefined()
  })

  it('forgets the track that plays when it is cleared', () => {
    saveCurrentTrack(tracks[0])
    saveCurrentTrack(null)

    expect(readCurrentTrack()).toBeNull()
  })

  it('plays every track of the queue once when the shuffle is on', () => {
    useStore.setState({ shuffle: false })
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()

    const order = useStore.getState().shuffleOrder
    const played = [useStore.getState().currentTrack?.id]

    for (let step = 0; step < 2; step += 1) {
      useStore.getState().nextTrack()
      played.push(useStore.getState().currentTrack?.id)
    }

    expect(played).toEqual(order)
    expect(new Set(played).size).toBe(3)
  })

  it('stops the music when every track of the queue was heard', () => {
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()
    useStore.getState().setPlaying(true)

    for (let step = 0; step < 2; step += 1) useStore.getState().nextTrack()

    expect(useStore.getState().isPlaying).toBe(true)

    useStore.getState().nextTrack()

    expect(useStore.getState().isPlaying).toBe(false)
  })

  it('plays the tracks of the queue again when the repeat is on', () => {
    useStore.setState({ repeat: 'all' })
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()
    useStore.getState().setPlaying(true)

    for (let step = 0; step < 3; step += 1) useStore.getState().nextTrack()

    expect(useStore.getState().currentTrack).not.toBeNull()
    expect(useStore.getState().isPlaying).toBe(true)
  })

  it('plays the tracks of the queue in the order of the shuffle', () => {
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()

    const order = useStore.getState().shuffleOrder

    expect(order).toHaveLength(3)
    expect(order[0]).toBe('1')
    expect(new Set(order).size).toBe(3)
  })

  it('goes back to the track before in the order of the shuffle', () => {
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()

    useStore.getState().nextTrack()
    const second = useStore.getState().currentTrack?.id

    useStore.getState().previousTrack()

    expect(useStore.getState().currentTrack?.id).toBe('1')
    expect(second).not.toBe('1')
  })

  it('keeps the order of the shuffle in step with the queue', () => {
    useStore.getState().setTrack(tracks[0], tracks)
    useStore.getState().toggleShuffle()

    useStore.getState().addToQueue(makeTrack('4'))

    const order = useStore.getState().shuffleOrder

    expect(order).toHaveLength(4)
    expect(order).toContain('4')
    expect(new Set(order).size).toBe(4)
  })

  it('keeps the place of the track that plays when a row before it moves', () => {
    useStore.getState().setTrack(tracks[2], tracks)

    useStore.getState().playNext(tracks[0])

    expect(useStore.getState().queue.map((item) => item.id)).toEqual(['2', '3', '1'])
    expect(useStore.getState().currentTrack?.id).toBe('3')
    expect(useStore.getState().queueIndex).toBe(1)
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
