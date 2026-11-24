import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string
  audioUrl: string
  duration: number
  likes: number
  genre: string
}

export interface Album {
  id: string
  title: string
  artist: string
  coverUrl: string
  tracks: Track[]
  releaseYear: number
}

export interface Playlist {
  id: string
  title: string
  tracks: Track[]
  isPublic: boolean
}

export interface Artist {
  id: string
  name: string
  bio: string
  followers: number
}

export interface User {
  id: string
  name: string
  avatarUrl: string
  isGuest: boolean
}

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
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
  language: 'ru' | 'en'
  theme: 'dark' | 'light'
  hapticsEnabled: boolean
  setLanguage: (lang: 'ru' | 'en') => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleHaptics: () => void
}

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
  migrateGuestData: () => void
}

export type SoniclyStore = PlayerState & LibraryState & SettingsState & AuthState

export const storeInstance = create<SoniclyStore>()(
  persist(
    (set, get) => ({
      // Player
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
      toggleRepeat: () => {
        set((state) => {
          const next = state.repeat === 'none' ? 'one' : state.repeat === 'one' ? 'all' : 'none'
          return { repeat: next }
        })
      },
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      nextTrack: () => {
        const { queue, currentTrack, shuffle } = get()
        if (!queue.length) return
        const index = queue.findIndex((t) => t.id === currentTrack?.id)
        const nextIndex = shuffle ? Math.floor(Math.random() * queue.length) : (index + 1) % queue.length
        set({ currentTrack: queue[nextIndex] })
      },
      prevTrack: () => {
        const { queue, currentTrack, shuffle } = get()
        if (!queue.length) return
        const index = queue.findIndex((t) => t.id === currentTrack?.id)
        const prevIndex = shuffle ? Math.floor(Math.random() * queue.length) : (index - 1 + queue.length) % queue.length
        set({ currentTrack: queue[prevIndex] })
      },

      // Library
      likedTracks: [],
      playlists: [],
      addLike: (track) => set((state) => ({ likedTracks: [...state.likedTracks, track] })),
      removeLike: (trackId) => set((state) => ({ likedTracks: state.likedTracks.filter((t) => t.id !== trackId) })),
      addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
      removePlaylist: (id) => set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) })),

      // Settings
      language: 'ru',
      theme: 'dark',
      hapticsEnabled: true,
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      // Auth
      user: { id: 'guest', name: 'Гость', avatarUrl: '', isGuest: true },
      login: (user) => {
        const { likedTracks, playlists, migrateGuestData } = get()
        set({ user })
        migrateGuestData()
      },
      logout: () => set({ user: { id: 'guest', name: 'Гость', avatarUrl: '', isGuest: true } }),
      migrateGuestData: () => {
        // Logic to migrate guest data to account
      },
    }),
    {
      name: 'sonicly-storage',
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
    }
  )
)

export const useStore = () => storeInstance
export const createStore = create<SoniclyStore>
export default storeInstance
