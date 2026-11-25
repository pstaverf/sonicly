import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import type { Language } from '../types'

const resources = {
  ru: {
    translation: {
      home: 'Главная',
      search: 'Поиск',
      library: 'Моя коллекция',
      login: 'Войти',
      logout: 'Выйти',
      continueGuest: 'Продолжить как гость',
      playlists: 'Плейлисты',
      haptics: 'Вибрация',
      on: 'Вкл',
      off: 'Выкл',
      player: {
        play: 'Воспроизвести',
        pause: 'Пауза',
        next: 'Следующий',
        prev: 'Предыдущий',
        shuffle: 'Случайный порядок',
        repeat: 'Повтор',
        like: 'Нравится',
        volume: 'Громкость',
      },
      wave: 'Моя волна',
      newReleases: 'Новинки',
      popular: 'Популярное',
      playlistsOfDay: 'Плейлисты дня',
      genres: 'Жанры',
      charts: 'Чарты',
      searchPlaceholder: 'Искать треки, альбомы, артистов...',
      welcome: 'Sonicly: слушай музыку онлайн',
      description: 'Бесплатный музыкальный сервис без регистрации. Плейлисты, новинки, чарты.',
      signInPrompt: 'Войдите, чтобы синхронизировать данные',
      successAdded: 'Добавлено в плейлист',
      errorEmptySearch: 'Поиск пуст',
      loading: 'Загрузка...',
    },
  },
  en: {
    translation: {
      home: 'Home',
      search: 'Search',
      library: 'My Collection',
      login: 'Login',
      logout: 'Logout',
      continueGuest: 'Continue as Guest',
      playlists: 'Playlists',
      haptics: 'Vibration',
      on: 'On',
      off: 'Off',
      player: {
        play: 'Play',
        pause: 'Pause',
        next: 'Next',
        prev: 'Previous',
        shuffle: 'Shuffle',
        repeat: 'Repeat',
        like: 'Like',
        volume: 'Volume',
      },
      wave: 'My Wave',
      newReleases: 'New Releases',
      popular: 'Popular',
      playlistsOfDay: 'Playlists of the Day',
      genres: 'Genres',
      charts: 'Charts',
      searchPlaceholder: 'Search tracks, albums, artists...',
      welcome: 'Sonicly: listen to music online',
      description: 'Free music service without registration. Playlists, new releases, charts.',
      signInPrompt: 'Sign in to sync your data',
      successAdded: 'Added to playlist',
      errorEmptySearch: 'Search is empty',
      loading: 'Loading...',
    },
  },
}

const DEFAULT_LANGUAGE: Language = 'ru'

export const detectBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
}

export { i18n }
export default i18n
