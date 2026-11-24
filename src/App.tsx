import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { PlayerBar } from './components/PlayerBar'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { LibraryPage } from './pages/LibraryPage'
import { AlbumPage } from './pages/AlbumPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { LoginPage } from './pages/LoginPage'
import { useStore } from './store'
import { useEffect } from 'react'

export const App = () => {
  const { theme, language } = useStore()

  useEffect(() => {
    document.documentElement.className = `${theme} ${language}`
  }, [theme, language])

  return (
    <div className="min-h-screen bg-background text-text transition-spring">
      <Sidebar />
      <Header />
      <main className="md:pl-64 pb-24 pt-16 min-h-screen transition-spring">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      <PlayerBar />
    </div>
  )
}
