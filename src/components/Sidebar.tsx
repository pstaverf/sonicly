import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'
import { useHaptics } from '../hooks/useHaptics'

import { NotificationBadge } from './motion/NotificationBadge'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-spring ${
    isActive ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-white/5 hover:text-text'
  }`

export const Sidebar = () => {
  const { t } = useTranslation()
  const { vibrate, patterns } = useHaptics()
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const hapticsEnabled = useStore((state) => state.hapticsEnabled)
  const toggleHaptics = useStore((state) => state.toggleHaptics)
  const likedTracks = useStore((state) => state.likedTracks)
  const playlists = useStore((state) => state.playlists)
  const user = useStore((state) => state.user)

  const handleThemeToggle = () => {
    vibrate(patterns.light)
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleHapticsToggle = () => {
    vibrate(patterns.light)
    toggleHaptics()
  }

  return (
    <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width) flex-col border-r border-white/10 md:flex">
      <div className="flex items-center gap-2 px-6 py-5 text-xl font-bold text-accent">
        <span aria-hidden="true">🎵</span>
        <span>Sonicly</span>
      </div>

      <nav className="flex-1 space-y-1 px-4" aria-label={t('nav.main')}>
        <NavLink to="/" className={linkClass} end onClick={() => vibrate(patterns.light)}>
          <span aria-hidden="true">🏠</span>
          <span>{t('nav.home')}</span>
        </NavLink>
        <NavLink to="/search" className={linkClass} onClick={() => vibrate(patterns.light)}>
          <span aria-hidden="true">🔍</span>
          <span>{t('nav.search')}</span>
        </NavLink>
        <span className="relative inline-flex w-full">
          <NavLink to="/library" className={linkClass} onClick={() => vibrate(patterns.light)}>
            <span aria-hidden="true">📚</span>
            <span>{t('nav.library')}</span>
          </NavLink>
          <NotificationBadge count={likedTracks.length} />
        </span>
        <NavLink to="/library?tab=wave" className={linkClass} onClick={() => vibrate(patterns.light)}>
          <span aria-hidden="true">🌊</span>
          <span>{t('nav.wave')}</span>
        </NavLink>
        <NavLink to="/library?tab=history" className={linkClass} onClick={() => vibrate(patterns.light)}>
          <span aria-hidden="true">🕘</span>
          <span>{t('nav.history')}</span>
        </NavLink>
      </nav>

      <div className="border-t border-white/10 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {t('nav.playlists')}
        </h2>
        <div className="space-y-0.5">
          {playlists.length === 0 ? (
            <p className="px-4 py-2 text-xs text-muted">{t('library.emptyPlaylists')}</p>
          ) : (
            playlists.map((playlist) => (
              <p key={playlist.id} className="truncate px-4 py-1.5 text-sm text-muted">
                {playlist.title}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1 border-t border-white/10 p-4">
        <h2 className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">
          {t('settings')}
        </h2>
        <button
          type="button"
          onClick={handleThemeToggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-muted transition-spring hover:bg-white/5 hover:text-text"
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
        </button>
        <button
          type="button"
          onClick={handleHapticsToggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-muted transition-spring hover:bg-white/5 hover:text-text"
        >
          <span aria-hidden="true">📳</span>
          <span>
            {t('haptics')}: {hapticsEnabled ? t('on') : t('off')}
          </span>
        </button>
        <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted">
          <span aria-hidden="true">👤</span>
          <span className="truncate">{user.name}</span>
        </div>
      </div>
    </aside>
  )
}
