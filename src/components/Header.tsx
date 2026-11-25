import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store'

export const Header = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = useStore((state) => state.language)
  const setLanguage = useStore((state) => state.setLanguage)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const user = useStore((state) => state.user)
  const login = useStore((state) => state.login)
  const logout = useStore((state) => state.logout)

  const handleLogin = () => {
    login({ id: 'user-1', name: 'Пользователь', avatarUrl: '', isGuest: false })
  }

  return (
    <header className="fixed top-0 inset-x-0 glass border-b border-white/10 z-30 transition-spring md:pl-64">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label="Назад"
          >
            ◀
          </button>
          <button
            onClick={() => navigate(1)}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label="Вперёд"
          >
            ▶
          </button>
          <div className="hidden md:block relative w-96">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-spring"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label="Уведомления"
          >
            🔔
          </button>
          <button
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label="Язык"
          >
            {language === 'ru' ? 'EN' : 'RU'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-300 hover:text-accent transition-spring"
            aria-label="Тема"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user?.isGuest ? (
            <button
              onClick={handleLogin}
              className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold transition-spring"
            >
              {t('login')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-400 transition-spring"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
