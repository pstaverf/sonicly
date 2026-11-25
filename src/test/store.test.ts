import { beforeEach, describe, expect, it } from 'vitest'

import { useStore } from '../store'
import { tracks } from '../api'

const reset = () => {
  useStore.setState({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    volume: 80,
    shuffle: false,
    repeat: 'none',
    currentTime: 0,
    duration: 0,
    likedTracks: [],
    playlists: [],
    language: 'ru',
    theme: 'dark',
    hapticsEnabled: true,
    user: { id: 'guest', name: 'Гость', avatarUrl: '', isGuest: true },
  })
}

describe('sonicly store', () => {
  beforeEach(reset)

  it('starts in guest mode with dark theme and russian locale', () => {
    const state = useStore.getState()

    expect(state.user?.isGuest).toBe(true)
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

    useStore.getState().addLike(track)
    useStore.getState().addLike(track)
    expect(useStore.getState().likedTracks).toHaveLength(1)

    useStore.getState().removeLike(track.id)
    expect(useStore.getState().likedTracks).toHaveLength(0)
  })

  it('cycles repeat mode through none, one and all', () => {
    useStore.getState().toggleRepeat()
    expect(useStore.getState().repeat).toBe('one')

    useStore.getState().toggleRepeat()
    expect(useStore.getState().repeat).toBe('all')

    useStore.getState().toggleRepeat()
    expect(useStore.getState().repeat).toBe('none')
  })

  it('advances and rewinds inside the queue', () => {
    useStore.getState().setQueue(tracks.slice(0, 3))
    useStore.getState().setTrack(tracks[0])

    useStore.getState().nextTrack()
    expect(useStore.getState().currentTrack?.id).toBe(tracks[1].id)

    useStore.getState().prevTrack()
    expect(useStore.getState().currentTrack?.id).toBe(tracks[0].id)
  })

  it('wraps around when moving before the first track', () => {
    useStore.getState().setQueue(tracks.slice(0, 3))
    useStore.getState().setTrack(tracks[0])

    useStore.getState().prevTrack()
    expect(useStore.getState().currentTrack?.id).toBe(tracks[2].id)
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
    useStore.getState().login({ id: 'u1', name: 'Мария', avatarUrl: '', isGuest: false })
    expect(useStore.getState().user?.isGuest).toBe(false)

    useStore.getState().logout()
    expect(useStore.getState().user?.isGuest).toBe(true)
  })
})
