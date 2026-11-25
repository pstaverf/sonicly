# Sonicly

## О проекте
Веб-сайт музыкальной платформы «Sonicly» — современный фронтенд (React 18 + Vite 8 + TypeScript strict) с Liquid Glass дизайном, глобальным плеером (Howler.js), статической генерацией (SSG) и моковым API (TanStack Query).

## Технологии
- **Фронтенд**: React 18.3, Vite 8, TypeScript 5.9 (strict)
- **Стили**: Tailwind CSS v4 (CSS-first конфигурация, тёмная тема по умолчанию, Liquid Glass)
- **Состояние**: Zustand 5 + persist (плеер, лайки, плейлисты, язык, тема, сессия)
- **Роутинг**: React Router 7
- **Плеер**: Howler.js (глобальный экземпляр вне роутов, Media Session API)
- **Данные**: TanStack Query 5 (мок-API, задержка 300–600 мс)
- **Локализация**: react-i18next (RU/EN)
- **SEO**: react-helmet-async + собственный SSG-пререндер (`scripts/prerender.mjs`)
- **Анимации**: transitions.dev (reveal, apply, refine, polish, Number pop-in, Notification badge, Icon swap, Success check, Error shake, Tabs sliding, Shimmer text)
- **Вибрация**: useHaptics (navigator.vibrate)
- **Тесты**: Vitest 5 + Testing Library (jsdom)

## Структура
```
src/
├── components/      # Sidebar, Header, PlayerBar, CoverImage
├── pages/           # HomePage, SearchPage, LibraryPage, AlbumPage, PlaylistPage, LoginPage
├── store/           # Zustand store (player, library, settings, auth)
├── api/             # Mock API (TanStack Query)
├── i18n/            # i18next configuration (RU/EN)
├── styles/          # Tailwind CSS, Liquid Glass, transitions
├── hooks/           # useHaptics
├── lib/             # player instance (Howler.js)
├── test/            # Vitest suites (api, store, app, prerender, hydration)
├── types/           # Track, Album, Playlist, User, Theme, Language, RepeatMode
├── entry-server.tsx # SSR-рендер для пререндера
└── main.tsx         # Клиентский вход: hydrateRoot / createRoot
scripts/
└── prerender.mjs    # Сборка статических страниц из dist/index.html
```

## Дизайн (Liquid Glass)
- Полупрозрачные стеклянные поверхности (`backdrop-filter: blur + saturate`)
- Тонкие светлые границы 1px с градиентом
- Живой фон (размытые пятна под цвет обложки)
- Типографика: Manrope Variable (подключается локально, без внешних запросов)
- Скругления: 16–28px
- Анимации: transform, opacity, filter (transitions.dev)
- `prefers-reduced-motion` отключает движение

## Гостевой режим
- Слушать музыку можно без регистрации
- Лайки и плейлисты сохраняются в `localStorage`
- Стекло-предложение войти при действиях, требующих аккаунта

## SEO и индексация
- Пререндер (SSG) публичных страниц: `/`, `/search`, `/library`, `/album/:id`, `/playlist/:id`, `/login`
- Каждая страница отдаёт готовый HTML с контентом, canonical, Open Graph, Twitter Card и JSON-LD
- Состояние TanStack Query сериализуется в `window.__SONICLY_STATE__` и гидратируется на клиенте без повторного запроса
- robots.txt, sitemap.xml, favicon, manifest.webmanifest, og-image

## Производительность
- Обложки отдаются в AVIF → WebP → JPEG через `<picture>`
- Ленивая загрузка изображений (`loading="lazy"`, `decoding="async"`)
- Локальный variable-шрифт с `font-display: swap`
- Код-разделение по маршрутам через React Router

## Запуск
```bash
npm install       # установка зависимостей
npm run dev       # разработка на http://localhost:5173
npm run build     # tsc + vite build + SSG-пререндер
npm run preview   # предпросмотр production-сборки на http://localhost:4173
npm run lint      # ESLint 9 (flat config), без предупреждений
npm run typecheck # tsc -b --force
npm test          # Vitest
```

## Требования
- Node.js `>= 20.19` (проверено на Node 22 и 26)
- npm 10+; для npm 11/12 postinstall-скрипты esbuild разрешены через `allowScripts` в `package.json`

## Коммиты
- `feat(init)`: инициализация структуры, роутинга, i18n, стора и базовых компонентов
- `fix(lint)`: исправление ошибок парсинга и импортов, фикс компонента App и типов плеера
- `fix(config)`: исправление конфигурации postcss и отключение плагина ssg для стабильности разработки
- `chore(deps)`: обновление зависимостей до актуальных версий (устранение уязвимостей)
- `feat(toolchain)`: переход на Vite 8, Tailwind v4, Vitest 5, ESLint 9 flat config
- `feat(ssg)`: собственный пререндер на React + react-helmet-async, гидрация через TanStack Query
- `feat(assets)`: генерация обложек (AVIF/WebP/JPEG) и аудиодорожек для мок-данных
- `feat(i18n)`: детерминированный язык серверного рендера без расхождений при гидрации
- `test(core)`: покрытие API, стора, приложения, пререндера и гидрации

## Дизайнерские особенности
- **Liquid Glass**: класс `glass` для поверхностей
- **Адаптивность**: десктоп (сайдбар), планшет (свёрнутый сайдбар), мобильный (нижняя навигация)
- **Анимации**: каскадные появления, плавная смена цвета фона, преломление на ховере
