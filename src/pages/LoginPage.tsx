import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../hooks/useAuth'
import { useHaptics } from '../hooks/useHaptics'
import { useStore } from '../store'
import { InputShake } from '../components/motion/InputShake'
import { SuccessCheck } from '../components/motion/SuccessCheck'
import { Seo } from '../components/Seo'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { vibrate, patterns } = useHaptics()
  const auth = useAuth()
  const user = useStore((state) => state.user)

  const redirect = useRef<number | null>(null)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(
    () => () => {
      if (redirect.current !== null) window.clearTimeout(redirect.current)
    },
    [],
  )

  const validate = (): boolean => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError(t('auth.invalidEmail'))
      vibrate(patterns.error)
      return false
    }

    if (password.length < 6) {
      setFieldError(t('auth.invalidPassword'))
      vibrate(patterns.error)
      return false
    }

    setFieldError(null)
    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const ok =
      mode === 'signIn'
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password)

    if (ok) {
      vibrate(patterns.success)
      setDone(true)
      redirect.current = window.setTimeout(() => navigate('/'), 600)
    } else {
      vibrate(patterns.error)
    }
  }

  const handleGoogle = async () => {
    const ok = await auth.signInWithGoogle()
    if (!ok) vibrate(patterns.error)
  }

  if (user.isGuest === false) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <SuccessCheck trigger={1} className="text-accent" />
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
        <button
          type="button"
          onClick={() => void auth.signOut()}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-spring hover:opacity-90"
        >
          {t('auth.signOut')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Seo
        title={t('auth.title')}
        description={t('auth.subtitle')}
        path="/login"
        noindex
      />

      <h1 className="text-2xl font-bold tracking-tight text-balance">{t('auth.title')}</h1>
      <p className="mt-2 text-sm text-muted">{t('auth.subtitle')}</p>

      <div className="glass mt-8 rounded-2xl p-6">
        {!auth.configured ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t('auth.guestTitle')}</p>
            <p className="text-sm text-muted">{t('auth.guestDescription')}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90"
            >
              {t('auth.continueGuest')}
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <InputShake error={fieldError !== null} message={fieldError ?? ''}>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldError(null)
                }}
                placeholder={t('auth.email')}
                autoComplete="email"
                aria-label={t('auth.email')}
                className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </InputShake>

            <InputShake error={fieldError !== null} message={fieldError ?? ''}>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldError(null)
                }}
                placeholder={t('auth.password')}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                aria-label={t('auth.password')}
                className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </InputShake>

            {auth.error && (
              <p role="alert" className="text-sm text-red-400">
                {t('auth.authFailed')}: {auth.error}
              </p>
            )}

            <button
              type="submit"
              disabled={auth.pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-spring hover:opacity-90 disabled:opacity-50"
            >
              {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
            </button>

            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={auth.pending}
              className="rounded-xl glass px-5 py-2.5 text-sm font-semibold transition-spring hover:border-accent/40 disabled:opacity-50"
            >
              {t('auth.signInWithGoogle')}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                setFieldError(null)
                auth.clearError()
              }}
              className="text-xs text-muted transition-spring hover:text-text"
            >
              {mode === 'signIn' ? t('auth.noAccount') : t('auth.haveAccount')}
            </button>
          </form>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 text-sm text-muted transition-spring hover:text-text"
      >
        {t('auth.continueGuest')}
      </button>

      {done && (
        <p role="status" className="mt-4 text-sm text-accent">
          {t('toast.signedIn')}
        </p>
      )}
    </div>
  )
}

export default LoginPage
