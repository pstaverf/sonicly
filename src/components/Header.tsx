import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'

import { IconSwap } from './motion/IconSwap'
import { NotificationBadge } from './motion/NotificationBadge'

export const Header = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = useStore((state) => state.language)
  const setLanguage = useStore((state) => state.setLanguage)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const likedTracks = useStore((state) => state.likedTracks)
  const history = useStore((state) => state.history)

  const notifications = likedTracks.length + history.length

  return (
    <header className="glass fixed inset-x-0 top-0 z-30 h-16 border-b border-white/10 md:pl-(--sidebar-width)">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-muted transition-spring hover:text-text"
            aria-label={t('header.back')}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="rounded-lg p-2 text-muted transition-spring hover:text-text"
            aria-label={t('header.forward')}
          >
            ▶
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="rounded-lg px-3 py-2 text-sm text-muted transition-spring hover:text-text"
            aria-label={t('header.search')}
          >
            🔍
          </button>

          <span className="relative inline-flex">
            <button
              type="button"
              className="relative rounded-lg p-2 text-muted transition-spring hover:text-text"
              aria-label={t('header.notifications')}
            >
              🔔
            </button>
            <NotificationBadge count={notifications} />
          </span>

          <button
            type="button"
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-muted transition-spring hover:text-text"
            aria-label={t('header.language')}
          >
            {language === 'ru' ? 'EN' : 'RU'}
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 transition-spring hover:text-text"
            aria-label={t('header.theme')}
          >
            <IconSwap
              state={theme === 'dark' ? 'a' : 'b'}
              iconA={<span aria-hidden="true">🌙</span>}
              iconB={<span aria-hidden="true">☀️</span>}
            />
          </button>
        </div>
      </div>
    </header>
  )
}
