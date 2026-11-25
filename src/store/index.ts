import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { Language, LocalPlaylist, RepeatMode, Theme, Track, User } from '../types'

export interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  currentTime: number
  duration: number
  isFullscreen: boolean
  setTrack: (track: Track, queue?: Track[]) => void
  playNow: (track: Track, queue?: Track[]) => void
  playNext: (track: Track) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  moveInQueue: (from: number, to: number) => void
  clearQueue: () => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  nextTrack: () => void
  previousTrack: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setFullscreen: (open: boolean) => void
}

export interface LibraryState {
  likedTracks: Track[]
  playlists: LocalPlaylist[]
  history: Track[]
  toggleLike: (track: Track) => void
  isLiked: (trackId: string) => boolean
  setLikedTracks: (tracks: Track[]) => void
  setPlaylists: (playlists: LocalPlaylist[]) => void
  createPlaylist: (title: string) => LocalPlaylist
  renamePlaylist: (id: string, title: string) => void
  deletePlaylist: (id: string) => void
  addToPlaylist: (playlistId: string, track: Track) => void
  removeFromPlaylist: (playlistId: string, trackId: string) => void
  pushHistory: (track: Track) => void
  clearHistory: () => void
}

export interface SettingsState {
  language: Language
  theme: Theme
  hapticsEnabled: boolean
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  toggleHaptics: () => void
}

export interface AuthState {
  user: User
  login: (user: User) => void
  logout: () => void
}

export type SoniclyStore = PlayerState & LibraryState & SettingsState & AuthState

const guestUser: User = {
  id: 'guest',
  email: null,
  name: 'Гость',
  avatarUrl: '',
  isGuest: true,
}

const memory = new Map<string, string>()

const fallbackStorage: Storage = {
  get length() {
    return memory.size
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => {
    memory.delete(key)
  },
  setItem: (key, value) => {
    memory.set(key, value)
  },
}

const shuffled = (tracks: Track[]): Track[] => {
  const copy = [...tracks]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export const useStore = create<SoniclyStore>()(
  persist(
    (set, get) => ({
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

      setTrack: (track, queue) =>
        set((state) => {
          const nextQueue = queue ?? state.queue
          const index = nextQueue.findIndex((item) => item.id === track.id)
          return {
            currentTrack: track,
            queue: nextQueue.length > 0 ? nextQueue : [track],
            queueIndex: index >= 0 ? index : 0,
            currentTime: 0,
            duration: track.duration,
          }
        }),

      playNow: (track, queue) =>
        set((state) => {
          const source = queue ?? state.queue
          const withoutTrack = source.filter((item) => item.id !== track.id)
          return {
            currentTrack: track,
            queue: [track, ...withoutTrack],
            queueIndex: 0,
            currentTime: 0,
            duration: track.duration,
            isPlaying: true,
          }
        }),

      playNext: (track) =>
        set((state) => {
          const queue = [...state.queue]
          const index = state.queueIndex
          queue.splice(index + 1, 0, track)
          return { queue }
        }),

      addToQueue: (track) =>
        set((state) => {
          if (state.queue.some((item) => item.id === track.id)) return state
          return { queue: [...state.queue, track] }
        }),

      removeFromQueue: (index) =>
        set((state) => {
          const queue = state.queue.filter((_, position) => position !== index)
          const queueIndex = Math.min(state.queueIndex, queue.length - 1)
          const currentTrack = state.queue[index]
          const removedCurrent = currentTrack?.id === state.currentTrack?.id
          return {
            queue,
            queueIndex: removedCurrent ? queueIndex : state.queueIndex,
            currentTrack: removedCurrent ? (queue[queueIndex] ?? null) : state.currentTrack,
            isPlaying: removedCurrent ? false : state.isPlaying,
          }
        }),

      moveInQueue: (from, to) =>
        set((state) => {
          if (from === to) return state
          if (from < 0 || from >= state.queue.length) return state
          if (to < 0 || to >= state.queue.length) return state

          const queue = [...state.queue]
          const [moved] = queue.splice(from, 1)
          queue.splice(to, 0, moved)

          const currentId = state.currentTrack?.id
          const queueIndex = queue.findIndex((item) => item.id === currentId)

          return { queue, queueIndex: queueIndex >= 0 ? queueIndex : state.queueIndex }
        }),

      clearQueue: () => set({ queue: [], queueIndex: -1 }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),

      nextTrack: () =>
        set((state) => {
          if (state.queue.length === 0) return state

          const { queue, queueIndex, repeat, shuffle } = state

          if (shuffle && queue.length > 1) {
            const candidates = queue.filter((_, index) => index !== queueIndex)
            const next = candidates[Math.floor(Math.random() * candidates.length)]
            const nextIndex = queue.findIndex((item) => item.id === next.id)
            return { currentTrack: next, queueIndex: nextIndex, currentTime: 0, duration: next.duration }
          }

          const isLast = queueIndex >= queue.length - 1

          if (isLast) {
            if (repeat === 'off') {
              return { isPlaying: false, currentTime: 0 }
            }
            const first = queue[0]
            return { currentTrack: first, queueIndex: 0, currentTime: 0, duration: first.duration }
          }

          const next = queue[queueIndex + 1]
          return { currentTrack: next, queueIndex: queueIndex + 1, currentTime: 0, duration: next.duration }
        }),

      previousTrack: () =>
        set((state) => {
          if (state.queue.length === 0) return state
          const { queue, queueIndex } = state
          const isFirst = queueIndex <= 0
          const index = isFirst ? queue.length - 1 : queueIndex - 1
          const previous = queue[index]
          return {
            currentTrack: previous,
            queueIndex: index,
            currentTime: 0,
            duration: previous.duration,
          }
        }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)), muted: false }),
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
        })),

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setFullscreen: (open) => set({ isFullscreen: open }),

      likedTracks: [],
      playlists: [],
      history: [],

      toggleLike: (track) =>
        set((state) => ({
          likedTracks: state.likedTracks.some((item) => item.id === track.id)
            ? state.likedTracks.filter((item) => item.id !== track.id)
            : [track, ...state.likedTracks],
        })),

      isLiked: (trackId) => get().likedTracks.some((item) => item.id === trackId),

      setLikedTracks: (tracks) => set({ likedTracks: tracks }),

      setPlaylists: (playlists) => set({ playlists }),

      createPlaylist: (title) => {
        const playlist: LocalPlaylist = {
          id: `local-${Date.now()}`,
          title,
          trackIds: [],
          createdAt: Date.now(),
        }
        set((state) => ({ playlists: [playlist, ...state.playlists] }))
        return playlist
      },

      renamePlaylist: (id, title) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id ? { ...playlist, title } : playlist,
          ),
        })),

      deletePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
        })),

      addToPlaylist: (playlistId, track) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId && !playlist.trackIds.includes(track.id)
              ? { ...playlist, trackIds: [...playlist.trackIds, track.id] }
              : playlist,
          ),
        })),

      removeFromPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) }
              : playlist,
          ),
        })),

      pushHistory: (track) =>
        set((state) => ({
          history: [track, ...state.history.filter((item) => item.id !== track.id)].slice(0, 60),
        })),

      clearHistory: () => set({ history: [] }),

      language: 'ru',
      theme: 'dark',
      hapticsEnabled: true,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      user: guestUser,
      login: (user) => set({ user }),
      logout: () =>
        set({
          user: guestUser,
          likedTracks: [],
          playlists: [],
          history: [],
        }),
    }),
    {
      name: 'sonicly-storage',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? fallbackStorage : window.localStorage,
      ),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        hapticsEnabled: state.hapticsEnabled,
        likedTracks: state.likedTracks,
        playlists: state.playlists,
        history: state.history,
        user: state.user,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    },
  ),
)

export const hasPersistedLanguage = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem('sonicly-storage')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: { language?: string } }
    return typeof parsed.state?.language === 'string'
  } catch {
    return false
  }
}

export { shuffled }
