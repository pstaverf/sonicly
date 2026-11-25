import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

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

const App = () => {
  const theme = useStore((state) => state.theme)
  const language = useStore((state) => state.language)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    root.lang = language
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
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <PlayerBar />
    </div>
  )
}

export default App
