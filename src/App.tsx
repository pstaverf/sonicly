import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { PlayerBar } from './components/PlayerBar'
import { MobileNav } from './components/MobileNav'
import { FullscreenPlayer } from './components/FullscreenPlayer'
import { LiveBackdrop } from './components/LiveBackdrop'
import { ErrorBoundary } from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import AlbumPage from './pages/AlbumPage'
import PlaylistPage from './pages/PlaylistPage'
import ArtistPage from './pages/ArtistPage'
import TrackPage from './pages/TrackPage'
import GenrePage from './pages/GenrePage'
import LoginPage from './pages/LoginPage'
import { detectBrowserLanguage, i18n } from './i18n'
import { hasPersistedLanguage, useStore } from './store'

const App = () => {
  const theme = useStore((state) => state.theme)
  const language = useStore((state) => state.language)
  const setLanguage = useStore((state) => state.setLanguage)
  const location = useLocation()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    root.lang = language
  }, [theme, language])

  useEffect(() => {
    const target = hasPersistedLanguage() ? language : detectBrowserLanguage()

    if (target !== language) {
      setLanguage(target)
      return
    }

    if (i18n.language !== target) {
      void i18n.changeLanguage(target)
    }
  }, [language, setLanguage])

  useEffect(() => {
    if (typeof document.startViewTransition !== 'function') return

    const transition = document.startViewTransition(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    })

    return () => {
      void transition.finished
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background text-text">
      <LiveBackdrop />
      <Sidebar />
      <Header />

      <main className="min-h-screen pb-[calc(var(--player-height)+4rem)] pt-16 transition-spring md:pb-[calc(var(--player-height)+2rem)] md:pl-(--sidebar-width)">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/album/:slug" element={<AlbumPage />} />
            <Route path="/playlist/:slug" element={<PlaylistPage />} />
            <Route path="/artist/:slug" element={<ArtistPage />} />
            <Route path="/track/:slug" element={<TrackPage />} />
            <Route path="/genre/:slug" element={<GenrePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <PlayerBar />
      <MobileNav />
      <FullscreenPlayer />
    </div>
  )
}

export default App
