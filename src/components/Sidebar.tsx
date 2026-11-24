import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const Sidebar = () => {
  const { language, setTheme, theme, toggleHaptics, hapticsEnabled, playlists, user } = useStore()
  const { vibrate, patterns } = useHaptics()
  const { t } = useTranslation()

  const handleThemeToggle = () => {
    vibrate(patterns.light)
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleHapticsToggle = () => {
    vibrate(patterns.light)
    toggleHaptics()
  }

  return (
    <aside className="fixed left-0 inset-y-0 w-64 glass border-r border-white/10 z-40 hidden md:flex flex-col transition-spring">
      <div className="p-6">
        <div className="flex items-center gap-2 text-accent text-2xl font-bold">
          <span>🎵</span>
          <span>Sonicly</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-spring ${
              isActive ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/5'
            }`
          }
        >
          <span>🏠</span>
          <span>{t('home')}</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-spring ${
              isActive ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/5'
            }`
          }
        >
          <span>🔍</span>
          <span>{t('search')}</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-spring ${
              isActive ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/5'
            }`
          }
        >
          <span>📚</span>
          <span>{t('library')}</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-white/10">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('playlists')}
        </h3>
        <div className="space-y-1">
          {playlists.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-accent transition-spring">
              <span>🎵</span>
              <span>{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 space-y-3">
        <button onClick={handleThemeToggle} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:text-accent transition-spring">
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
        <button onClick={handleHapticsToggle} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:text-accent transition-spring">
          <span>📳</span>
          <span>Вибрация: {hapticsEnabled ? 'Вкл' : 'Выкл'}</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300">
          <span>👤</span>
          <span>{user?.name}</span>
        </div>
      </div>
    </aside>
  )
}
