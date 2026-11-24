# Sonicly

## О проекте
Веб-сайт музыкальной платформы «Sonicly» — современный фронтенд (React 18 + Vite + TypeScript) с Liquid Glass дизайном, глобальным плеером (Howler.js) и моковым API (TanStack Query).

## Технологии
- **Фронтенд**: React 18, Vite, TypeScript (strict)
- **Стили**: Tailwind CSS (тёмная тема по умолчанию, Liquid Glass)
- **Состояние**: Zustand + persist (плеер, лайки, плейлисты, язык, тема, сессия)
- **Роутинг**: React Router
- **Плеер**: Howler.js (глобальный экземпляр, Media Session API)
- **Данные**: TanStack Query (мок-API, задержка 300-600 мс)
- **Локализация**: react-i18next (RU/EN)
- **Анимации**: transitions.dev (Number pop-in, Notification badge, Icon swap, Success check, Error shake, Tabs sliding, Shimmer text)
- **Вибрация**: useHaptics (navigator.vibrate)

## Структура
```
src/
├── components/      # Sidebar, Header, PlayerBar
├── pages/           # HomePage, SearchPage, LibraryPage, AlbumPage, PlaylistPage, LoginPage
├── store/           # Zustand store (player, library, settings, auth)
├── api/             # Mock API (TanStack Query)
├── i18n/            # i18next configuration (RU/EN)
├── styles/          # Tailwind CSS, Liquid Glass, transitions
├── hooks/           # useHaptics
├── lib/             # player instance (Howler.js)
└── types/           # Track, Album, Artist, Playlist, User
```

## Дизайн (Liquid Glass)
- Полупрозрачные стеклянные поверхности (`backdrop-filter: blur + saturate`)
- Тонкие светлые границы 1px с градиентом
- Живой фон (размытые пятна под цвет обложки)
- Типографика: Manrope / Inter Variable
- Скругления: 16-28px
- Анимации: transform, opacity, filter (transitions.dev)

## Гостевой режим
- Слушать музыку можно без регистрации
- Лайки и плейлисты сохраняются в `localStorage`
- Стекло-предложение войти при действиях, требующих аккаунта

## SEO и Индексация
- Пререндер (SSG) для публичных страниц (/, /search, /album/:id, /playlist/:id, /artist/:id, /track/:id)
- Мета-теги (react-helmet-async), Open Graph, Twitter Card
- Структурированные данные (JSON-LD)
- robots.txt, sitemap.xml, favicon, manifest.webmanifest

## Запуск
1. Установка зависимостей:
   ```bash
   npm install
   ```
2. Запуск разработки:
   ```bash
   npm run dev
   ```
3. Сборка:
   ```bash
   npm run build
   ```
4. Линтинг:
   ```bash
   npm run lint
   ```

## Превью
Веб-сайт запущен в режиме разработки на порту 5173.

## Коммиты
- `feat(init)`: инициализация структуры, роутинга, i18n, стора и базовых компонентов
- `fix(lint)`: исправление ошибок парсинга и импортов, фикс компонента App и типов плеера
- `fix(config)`: исправление конфигурации postcss и отключение плагина ssg для стабильности разработки

## Дизайнерские особенности
- **Liquid Glass**: `glass` класс для поверхностей
- **Адаптивность**: десктоп (сайдбар), планшет (свёрнутый сайдбар), мобильный (нижняя навигация)
- **Анимации**: каскадные появления, плавная смена цвета фона, преломление на ховере
