import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: {
    translation: {
      home: 'Главная',
      search: 'Поиск',
      library: 'Моя коллекция',
      login: 'Войти',
      continueGuest: 'Продолжить как гость',
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
    },
  },
  en: {
    translation: {
      home: 'Home',
      search: 'Search',
      library: 'My Collection',
      login: 'Login',
      continueGuest: 'Continue as Guest',
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
      signInPrompt: 'Sign in to sync data',
      successAdded: 'Added to playlist',
      errorEmptySearch: 'Search is empty',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language.startsWith('en') ? 'en' : 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  })

export { i18n }
export default i18n
