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
  shuffleOrder: string[]
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

/**
 * The order the tracks are played in when the shuffle is on. The track that
 * plays stands in front, so the next button moves to the one that follows.
 */
const buildShuffleOrder = (queue: Track[], currentId?: string | null): string[] => {
  const rest = shuffled(queue.filter((track) => track.id !== currentId)).map((track) => track.id)
  const current = currentId && queue.some((track) => track.id === currentId) ? [currentId] : []

  return [...current, ...rest]
}

/**
 * Keeps the order of the shuffle in step with the queue. The tracks that
 * left the queue are forgotten, the new ones are put at the end.
 */
const syncShuffleOrder = (order: string[], queue: Track[]): string[] => {
  const ids = new Set(queue.map((track) => track.id))
  const kept = order.filter((id) => ids.has(id))
  const known = new Set(kept)
  const added = shuffled(queue.filter((track) => !known.has(track.id))).map((track) => track.id)

  return [...kept, ...added]
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
      shuffleOrder: [],
      repeat: 'off',
      currentTime: 0,
      duration: 0,
      isFullscreen: false,

      setTrack: (track, queue) =>
        set((state) => {
          const source = queue ?? state.queue
          const index = source.findIndex((item) => item.id === track.id)

          // The track that plays has to stand in the queue, otherwise the
          // player jumps over the first row when it goes to the next one.
          const nextQueue = index >= 0 ? source : [track, ...source]
          const nextState = {
            currentTrack: track,
            queue: nextQueue.length > 0 ? nextQueue : [track],
            queueIndex: index >= 0 ? index : 0,
            currentTime: 0,
            duration: track.duration,
          }

          return {
            ...nextState,
            shuffleOrder: state.shuffle
              ? buildShuffleOrder(nextState.queue, track.id)
              : state.shuffleOrder,
          }
        }),

      playNow: (track, queue) =>
        set((state) => {
          const source = queue ?? state.queue
          const withoutTrack = source.filter((item) => item.id !== track.id)
          const nextQueue = [track, ...withoutTrack]

          return {
            currentTrack: track,
            queue: nextQueue,
            queueIndex: 0,
            currentTime: 0,
            duration: track.duration,
            isPlaying: true,
            shuffleOrder: state.shuffle
              ? buildShuffleOrder(nextQueue, track.id)
              : state.shuffleOrder,
          }
        }),

      playNext: (track) =>
        set((state) => {
          // The track is moved instead of copied, so the queue never holds
          // the same track twice.
          const existing = state.queue.findIndex((item) => item.id === track.id)
          const queue = [...state.queue]
          const index = state.queueIndex

          if (existing < 0) {
            queue.splice(index + 1, 0, track)
            return { queue, shuffleOrder: syncShuffleOrder(state.shuffleOrder, queue) }
          }

          queue.splice(existing, 1)

          // The rows before the current one shift, so the place for the next
          // track is counted from the position the current track keeps.
          const target = existing < index ? index : existing === index ? index : index + 1

          queue.splice(Math.min(target, queue.length), 0, track)

          // The track that plays keeps its place in the queue, even when the
          // rows before it move, so the player does not jump to another track.
          const currentIndex = queue.findIndex((item) => item.id === state.currentTrack?.id)

          return {
            queue,
            queueIndex: currentIndex >= 0 ? currentIndex : state.queueIndex,
            shuffleOrder: syncShuffleOrder(state.shuffleOrder, queue),
          }
        }),

      addToQueue: (track) =>
        set((state) => {
          if (state.queue.some((item) => item.id === track.id)) return state

          const queue = [...state.queue, track]

          return { queue, shuffleOrder: syncShuffleOrder(state.shuffleOrder, queue) }
        }),

      removeFromQueue: (index) =>
        set((state) => {
          const removed = state.queue[index]
          const queue = state.queue.filter((_, position) => position !== index)
          const removedCurrent = removed?.id === state.currentTrack?.id

          // The rows before the current one shift, so the index is looked up
          // again by the id of the track that is still playing.
          const currentIndex = queue.findIndex((item) => item.id === state.currentTrack?.id)
          const queueIndex =
            currentIndex >= 0 ? currentIndex : Math.min(state.queueIndex, queue.length - 1)

          return {
            queue,
            queueIndex,
            currentTrack: removedCurrent ? (queue[queueIndex] ?? null) : state.currentTrack,
            isPlaying: removedCurrent ? false : state.isPlaying,
            shuffleOrder: syncShuffleOrder(state.shuffleOrder, queue),
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

          return {
            queue,
            queueIndex: queueIndex >= 0 ? queueIndex : state.queueIndex,
            shuffleOrder: syncShuffleOrder(state.shuffleOrder, queue),
          }
        }),

      clearQueue: () => set({ queue: [], queueIndex: -1, shuffleOrder: [] }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),

      nextTrack: () =>
        set((state) => {
          if (state.queue.length === 0) return state

          const { queue, queueIndex, repeat, shuffle } = state

          if (shuffle && queue.length > 1) {
            // The tracks are played in the order of the shuffle, so every
            // track of the queue is heard once before one of them comes back.
            const order = state.shuffleOrder.length
              ? syncShuffleOrder(state.shuffleOrder, queue)
              : buildShuffleOrder(queue, state.currentTrack?.id)

            const position = order.indexOf(state.currentTrack?.id ?? '')
            const nextId = position >= 0 ? order[position + 1] : order[0]

            if (!nextId) {
              // Every track of the queue was heard. The music stops, unless
              // the repeat is on.
              if (repeat === 'off') return { isPlaying: false, currentTime: 0 }

              const repeated = buildShuffleOrder(queue)
              const first = repeated[0]
              const firstIndex = queue.findIndex((item) => item.id === first)

              return {
                currentTrack: queue[firstIndex],
                queueIndex: firstIndex,
                currentTime: 0,
                duration: queue[firstIndex].duration,
                shuffleOrder: repeated,
              }
            }

            const nextIndex = queue.findIndex((item) => item.id === nextId)
            const next = queue[nextIndex]

            return {
              currentTrack: next,
              queueIndex: nextIndex,
              currentTime: 0,
              duration: next.duration,
              shuffleOrder: order,
            }
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

          // With the shuffle on, the way back leads over the tracks that were
          // played before. After the first one, the way back leads to the
          // last one of the order.
          if (state.shuffle && state.shuffleOrder.length > 1) {
            const order = state.shuffleOrder
            const position = order.indexOf(state.currentTrack?.id ?? '')
            const previousId = position > 0 ? order[position - 1] : order[order.length - 1]

            if (previousId) {
              const previousIndex = queue.findIndex((item) => item.id === previousId)
              const previous = queue[previousIndex]

              return {
                currentTrack: previous,
                queueIndex: previousIndex,
                currentTime: 0,
                duration: previous.duration,
              }
            }
          }

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
      toggleShuffle: () =>
        set((state) => ({
          shuffle: !state.shuffle,
          // The order of the shuffle is built when it is turned on, so every
          // track of the queue is heard once before one of them comes back.
          shuffleOrder: state.shuffle ? [] : buildShuffleOrder(state.queue, state.currentTrack?.id),
        })),
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

/**
 * The track that plays stands apart from the rest of the store: it is
 * written down in its own place and brought back after the page was built,
 * so the markup of the server and the markup of the browser stay the same.
 */
export const CURRENT_TRACK_KEY = 'sonicly-current-track'

export const saveCurrentTrack = (track: Track | null): void => {
  if (typeof window === 'undefined') return

  try {
    if (track) window.localStorage.setItem(CURRENT_TRACK_KEY, JSON.stringify(track))
    else window.localStorage.removeItem(CURRENT_TRACK_KEY)
  } catch {
    // The storage is full or turned off, the music still plays.
  }
}

export const readCurrentTrack = (): Track | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CURRENT_TRACK_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Track
    return typeof parsed?.id === 'string' ? parsed : null
  } catch {
    return null
  }
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

export { shuffled }
