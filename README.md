# Sonicly

## О проекте
Sonicly — полноценная музыкальная платформа: живой поиск и каталог треков, альбомов, артистов и плейлистов из **Jamendo** и **Audius**, глобальный плеер с очередью, локальная библиотека и полностью рабочий гостевой режим без регистрации.

Моковых данных нет: каждый трек, обложка и страница приходят из реальных API. Если источник недоступен — приложение показывает честную ошибку и пробует второй источник.

## Технологии
- **Фронтенд**: React 18.3, Vite 8, TypeScript 5.9 (strict, без `any`)
- **Стили**: Tailwind CSS v4 (CSS-first конфигурация), Liquid Glass, живой фон
- **Состояние**: Zustand 5 + `persist` (плеер, очередь, лайки, плейлисты, история, язык, тема, сессия)
- **Роутинг**: React Router 7, Error Boundary на маршрутах
- **Плеер**: Howler.js (один глобальный экземпляр вне роутов) + Media Session API
- **Данные**: TanStack Query 5 (кэш, retry, prefetch по наведению, infinite scroll)
- **Источники**: Jamendo API v3 (основной), Audius API v1 (дополнительный)
- **Аутентификация**: Supabase Auth (email/password + Google) с RLS, guest-first
- **Локализация**: react-i18next (RU/EN), язык по умолчанию из браузера
- **SEO**: react-helmet-async + собственный SSG-пререндер (`scripts/prerender.mjs`)
- **Анимации**: `src/styles/transitions.css` (Number pop-in, Notification badge, Icon swap, Success check, Input shake, Sliding tabs, Shimmer)
- **Вибрация**: `navigator.vibrate` (light / medium / success / error, отключается в настройках)
- **Тесты**: Vitest 5 + Testing Library (jsdom)

## Переменные окружения
Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

| Переменная | Назначение | Обязательна |
| --- | --- | --- |
| `VITE_JAMENDO_CLIENT_ID` | публичный client ID Jamendo | да |
| `VITE_AUDIUS_APP_NAME` | имя приложения для Audius API | нет (`Sonicly`) |
| `VITE_SUPABASE_URL` | URL проекта Supabase | нет |
| `VITE_SUPABASE_ANON_KEY` | anon-ключ Supabase | нет |
| `VITE_GOOGLE_SITE_VERIFICATION` | код подтверждения Google | нет |

`.env` в `.gitignore` и никогда не попадает в репозиторий. Client secret и bearer-токены в фронтенд не попадают: для публичных read-эндпоинтов Jamendo и Audius авторизация не требуется.

Если Supabase не настроен, приложение работает в полноценном гостевом режиме: лайки, плейлисты и история хранятся локально, а при последующем входе переносятся в аккаунт.

## Источники музыки
Jamendo — основной источник, Audius — дополнение и резерв. Оба приводятся адаптерами в `src/api/adapters` к единым сущностям `Track`, `Album`, `Artist`, `Playlist`; поле `source` всегда указывает происхождение.

| Задача | Jamendo | Audius |
| --- | --- | --- |
| Домашняя страница | `/tracks`, `/albums`, `/artists`, `/playlists` | `/tracks/trending`, `/playlists/trending` |
| Поиск | `/tracks?search=`, `/albums?namesearch=`, `/artists?namesearch=`, `/playlists?namesearch=` | `/tracks/search`, `/users/search` |
| Альбом | `/albums?id=`, треки — `/tracks?album_id=` | `/playlists/{id}` |
| Плейлист | `/playlists?id=`, `/playlists/tracks` | `/playlists/{id}` |
| Артист | `/artists?id=`, `/tracks?artist_id=` | `/users/{handle}/tracks` |
| Трек | `/tracks?id=` | `/tracks/{id}` |

Аудио отдаётся напрямую из Jamendo (`audioformat=mp32`) и Audius (подписанный stream URL). Лицензия Creative Commons подтягивается через `include=licenses` и показывается на странице трека и альбома.

## Структура
```
src/
├── api/
│   ├── client.ts       # fetch, ApiError, сборка query-параметров
│   ├── jamendo.ts      # типизированный клиент Jamendo v3
│   ├── audius.ts       # типизированный клиент Audius v1
│   ├── adapters/       # jamendo.ts, audius.ts → unified entities
│   ├── fetchers.ts     # запросы без React, используются и в SSG
│   ├── index.ts        # TanStack Query hooks
│   └── genres.ts       # каталог жанров и настроений
├── components/         # Sidebar, Header, PlayerBar, FullscreenPlayer, TrackCard, Seo, States
│   └── motion/         # NumberPopIn, SuccessCheck, InputShake, SlidingTabs, NotificationBadge, IconSwap, Shimmer
├── pages/              # Home, Search, Library, Album, Playlist, Artist, Track, Genre, Login
├── store/              # Zustand store (player, library, settings, auth)
├── hooks/              # useAuth, useHaptics, useDebouncedValue, useIntersection, useDominantColor
├── lib/                # player (Howler + Media Session), color, slug, format, seo, supabase
├── i18n/               # i18next (RU/EN)
├── styles/             # index.css (Liquid Glass), transitions.css (motion tokens)
├── test/               # Vitest suites (api, store, app, prerender, hydration, i18n)
├── types/              # Source, Track, Album, Artist, Playlist, User, LocalPlaylist, SearchResults
├── entry-server.tsx    # SSR-рендер для пререндера
└── main.tsx            # клиентский вход: hydrateRoot / createRoot
scripts/
└── prerender.mjs       # SSG: реальные данные Jamendo/Audius + sitemap
supabase/
└── schema.sql          # таблицы likes/playlists и RLS-политики
```

## Маршруты
| Путь | Назначение |
| --- | --- |
| `/` | новинки, популярное, top-10 чарт, жанры, плейлисты дня, альбомы, артисты |
| `/search` | живой поиск с debounce 300 мс по трекам, альбомам, артистам и плейлистам |
| `/library` | лайки, «Моя волна», свои плейлисты, история |
| `/album/:slug` | альбом с треками и лицензиями |
| `/playlist/:slug` | плейлист с треками |
| `/artist/:slug` | артист и его треки |
| `/track/:slug` | трек: атрибуция, лицензия, ссылка на источник |
| `/genre/:slug` | жанр с бесконечной лентой |
| `/login` | вход и регистрация, предложение гостевого режима |

Slug читаемый и однозначный: `<название>-<источник>-<id>`, например `my-song-jamendo-123456`.

## Функциональность
- **Плеер и очередь**: drag-and-drop в полноэкранном плеере, «слушать следующим», «в очередь», shuffle, repeat off/all/one, корректные prev/next, preload следующего трека, Media Session API, клавиатурные команды (пробел — play/pause, Alt+←/→ — переключение).
- **Моя волна**: бесконечная очередь по лайкам и любимым жанрам с догрузкой у конца списка.
- **Живой фон**: доминирующий цвет реальной обложки извлекается на canvas и плавно меняет подсветку фона.
- **Гость**: лайки, плейлисты и история живут в `localStorage`; при входе данные переносятся в аккаунт.
- **Состояния**: реальные loading / empty / error + retry; недоступный трек автоматически пропускается.
- **Haptics**: `navigator.vibrate` с проверкой поддержки и переключателем в настройках.

## Дизайн (Liquid Glass)
- Полупрозрачные поверхности с `backdrop-filter: blur + saturate` и fallback без `backdrop-filter`
- Градиентные границы 1px, внутренняя подсветка, мягкие слоистые тени
- Типографика: Manrope Variable (локально, без внешних запросов), `clamp()`, tight tracking, `tabular-nums`, `text-wrap: balance`
- Скругления 16–28px, единый accent-токен
- View Transitions с fallback, каскадные появления, полноэкранный плеер с раскрытием обложки
- Анимируются только `transform`, `opacity`, `filter`; длительности и easing заданы CSS-переменными
- `prefers-reduced-motion` и `prefers-reduced-transparency` соблюдаются везде

## SEO и индексация
- Пререндер с реальными данными Jamendo и Audius на этапе сборки; маршруты собираются теми же фетчерами, что использует приложение, поэтому slug в ссылках всегда совпадает с роутером
- При недоступности API сборка не падает: остаются статические маршруты (`/`, `/search`, жанры), а sitemap собирается из фактически записанных страниц
- На каждой странице: title ≤ 60, description ≤ 155, canonical, hreflang ru/en/x-default, `html lang`
- Open Graph и Twitter Card 1200×630, JSON-LD: WebSite + SearchAction, Organization, MusicAlbum / MusicPlaylist / MusicRecording / MusicGroup, BreadcrumbList
- `/login` и `/library` закрыты от индексации (`noindex`)
- `robots.txt`, многоязычный `sitemap.xml` и `sitemap-en.xml`, favicon, manifest, OG-изображение

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

## Производительность
- Ленивая загрузка обложек (`loading="lazy"`, `decoding="async"`) и явные размеры для CLS
- Локальный variable-шрифт с `font-display: swap`
- Кэш TanStack Query, prefetch по наведению на трек, staleTime на разделы
- Один Howler-экземпляр и один Media Session вне дерева роутов

## Требования
- Node.js `>= 20.19` (проверено на Node 22)
- npm 10+; для npm 11/12 postinstall-скрипты esbuild разрешены через `allowScripts` в `package.json`

## Supabase
Схема таблиц `likes` и `playlists` с RLS-политиками лежит в `supabase/schema.sql`. Выполните её в SQL-редакторе Supabase, затем укажите `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`. Google OAuth включается в настройках провайдера Supabase Auth с redirect URL на домен приложения.
