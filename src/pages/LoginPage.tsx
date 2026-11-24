import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'

export const LoginPage = () => {
  const { t, i18n } = useTranslation()
  const { login, user } = useStore()

  const handleGuestContinue = () => {
    // Already guest, just navigate
    window.location.href = '/'
  }

  const handleFakeLogin = () => {
    login({ id: 'user-1', name: 'Пользователь', avatarUrl: '', isGuest: false })
    window.location.href = '/'
  }

  if (!user?.isGuest) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Войти — Sonicly</title>
        <meta name="description" content="Войдите в Sonicly, чтобы синхронизировать плейлисты и лайки." />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://sonicly.com/login" />
      </Helmet>

      <div className="max-w-md w-full glass border border-white/10 rounded-3xl p-8 transition-spring">
        <h1 className="text-3xl font-bold mb-2 text-balance transition-spring">
          {t('login')}
        </h1>
        <p className="text-gray-400 mb-8 transition-spring">
          {t('signInPrompt')}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleFakeLogin}
            className="w-full bg-accent text-white py-3 rounded-xl font-semibold transition-spring hover:bg-accent/90"
          >
            Войти через аккаунт
          </button>
          <button
            onClick={handleGuestContinue}
            className="w-full border border-white/10 py-3 rounded-xl font-semibold transition-spring hover:bg-white/5"
          >
            {t('continueGuest')}
          </button>
        </div>
      </div>
    </div>
  )
}
