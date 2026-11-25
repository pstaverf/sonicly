import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { Language, Playlist, RepeatMode, Theme, Track, User } from '../types'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  currentTime: number
  duration: number
  setTrack: (track: Track) => void
  setQueue: (queue: Track[]) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  nextTrack: () => void
  prevTrack: () => void
}

interface LibraryState {
  likedTracks: Track[]
  playlists: Playlist[]
  addLike: (track: Track) => void
  removeLike: (trackId: string) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (id: string) => void
}

interface SettingsState {
  language: Language
  theme: Theme
  hapticsEnabled: boolean
  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  toggleHaptics: () => void
}

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export type SoniclyStore = PlayerState & LibraryState & SettingsState & AuthState

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

export const useStore = create<SoniclyStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 80,
      shuffle: false,
      repeat: 'none',
      currentTime: 0,
      duration: 0,
      setTrack: (track) => set({ currentTrack: track }),
      setQueue: (queue) => set({ queue }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setVolume: (volume) => set({ volume }),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      toggleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === 'none' ? 'one' : state.repeat === 'one' ? 'all' : 'none',
        })),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      nextTrack: () => {
        const { queue, currentTrack, shuffle } = get()
        if (!queue.length) return
        const index = queue.findIndex((track) => track.id === currentTrack?.id)
        const nextIndex = shuffle ? Math.floor(Math.random() * queue.length) : (index + 1) % queue.length
        set({ currentTrack: queue[nextIndex] })
      },
      prevTrack: () => {
        const { queue, currentTrack, shuffle } = get()
        if (!queue.length) return
        const index = queue.findIndex((track) => track.id === currentTrack?.id)
        const prevIndex = shuffle ? Math.floor(Math.random() * queue.length) : (index - 1 + queue.length) % queue.length
        set({ currentTrack: queue[prevIndex] })
      },

      likedTracks: [],
      playlists: [],
      addLike: (track) =>
        set((state) =>
          state.likedTracks.some((item) => item.id === track.id)
            ? state
            : { likedTracks: [...state.likedTracks, track] },
        ),
      removeLike: (trackId) =>
        set((state) => ({ likedTracks: state.likedTracks.filter((track) => track.id !== trackId) })),
      addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
      removePlaylist: (id) => set((state) => ({ playlists: state.playlists.filter((item) => item.id !== id) })),

      language: 'ru',
      theme: 'dark',
      hapticsEnabled: true,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      user: { id: 'guest', name: 'Гость', avatarUrl: '', isGuest: true },
      login: (user) => set({ user }),
      logout: () => set({ user: { id: 'guest', name: 'Гость', avatarUrl: '', isGuest: true } }),
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
        user: state.user,
        currentTrack: state.currentTrack,
        queue: state.queue,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    },
  ),
)

export type { Language, Theme }
