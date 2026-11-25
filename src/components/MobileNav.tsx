import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'

import { NotificationBadge } from './motion/NotificationBadge'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.68rem] transition-spring ${
    isActive ? 'text-accent' : 'text-muted'
  }`

export const MobileNav = () => {
  const { t } = useTranslation()
  const likedTracks = useStore((state) => state.likedTracks)

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 md:hidden"
      aria-label={t('nav.main')}
    >
      <NavLink to="/" className={linkClass} end>
        <span aria-hidden="true">🏠</span>
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/search" className={linkClass}>
        <span aria-hidden="true">🔍</span>
        <span>{t('nav.search')}</span>
      </NavLink>
      <NavLink to="/library" className={linkClass}>
        <span className="relative inline-flex">
          <span aria-hidden="true">📚</span>
          <NotificationBadge count={likedTracks.length} />
        </span>
        <span>{t('nav.library')}</span>
      </NavLink>
      <NavLink to="/login" className={linkClass}>
        <span aria-hidden="true">👤</span>
        <span>{t('nav.home') === 'Главная' ? 'Вход' : 'Login'}</span>
      </NavLink>
    </nav>
  )
}
