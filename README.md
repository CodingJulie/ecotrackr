<div align="center">

# <img src="public/leaf.png" alt="" width="36" height="36" style="vertical-align: -0.15em;" /> EcoTrackr

**Русский** · [English](README.en.md)

**Open-source PWA для учёта и снижения личного углеродного следа (CO₂e)**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

[Сайт](https://ecotrackr-beta.vercel.app/) · [Live demo](https://ecotrackr-beta.vercel.app/demo) · [Быстрый старт](#-быстрый-старт) · [API](#-api) · [Лицензия](#-лицензия)

</div>

---

## 📸 Скриншоты

<table>
  <tr>
    <td align="center"><strong>Дашборд (desktop)</strong></td>
    <td align="center"><strong>Мобильная версия</strong></td>
  </tr>
  <tr>
    <td>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screenshot-desktop-dark-ru.png" />
        <source media="(prefers-color-scheme: light)" srcset="public/screenshot-desktop-light-ru.png" />
        <img src="public/screenshot-desktop-light-ru.png" alt="EcoTrackr dashboard on desktop" width="100%" />
      </picture>
    </td>
    <td>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screenshot-mobile-dark.png" />
        <source media="(prefers-color-scheme: light)" srcset="public/screenshot-mobile-light.png" />
        <img src="public/screenshot-mobile-light.png" alt="EcoTrackr on mobile" width="280" />
      </picture>
    </td>
  </tr>
</table>

> Скриншоты переключаются между светлой и тёмной темой в зависимости от настроек GitHub / системы. Также используются в PWA manifest (`app/manifest.json`) для установки приложения на домашний экран.

---

## 📖 О проекте

**EcoTrackr** — современное веб-приложение для осознанного потребления и борьбы с изменением климата. Пользователь фиксирует повседневные активности (транспорт, питание, энергия, покупки), получает расчёт выбросов CO₂e в реальном времени и видит прогресс на наглядных дашбордах.

### Для кого

- **Люди**, которые хотят понять свой реальный углеродный след
- **Эко-сообщества** — лидерборд и общий «лес сообщества»
- **Разработчики** — открытый стек, понятная архитектура, готовые Web Workers и PWA

### Ключевые возможности

| Категория | Что умеет |
|-----------|-----------|
| **Калькулятор CO₂e** | Транспорт, питание, энергия, покупки, быт — UI и расчёты из npm-пакета [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator) |
| **Дашборд** | KPI-карточки, тренды, карта активностей, геймификация (дерево, лес) |
| **AI Insights** | Персональные советы через Google Gemini с fallback без API-ключа |
| **Сообщество** | Лидерборд участников, агрегированная статистика |
| **Экспорт** | PDF, HTML, CSV, JSON — отчёты для личного архива или шеринга |
| **PWA** | Установка на устройство, Service Worker, offline-страница |
| **i18n** | Русский и английский (i18next, без префиксов в URL) |
| **Auth** | Регистрация, вход, сброс пароля через Supabase Auth |

---

## 🔗 Shareable-ссылки на профиль и результаты

EcoTrackr поддерживает несколько способов «поделиться» экологическим прогрессом:

### 1. Экспорт отчётов (реализовано)

На дашборде кнопка **Export** генерирует файлы с вашими данными:

| Формат | Назначение |
|--------|------------|
| **PDF** | Красивый отчёт для соцсетей, резюме, портфолио |
| **HTML** | Интерактивная страница — можно открыть в браузере и отправить |
| **CSV / JSON** | Данные для таблиц, аналитики, интеграций |

Файлы сохраняются локально с именем `ecotrackr-data-YYYY-MM-DD.{format}`.

### 2. Публичный лидерборд (реализовано)

Страница **`/dashboard/community`** показывает агрегированную статистику участников: имя, суммарный CO₂e, количество записей, медали. Данные не содержат детальных активностей — только итоги для соревновательного эффекта.

### 3. Shareable URL профиля (реализовано)

Публичный профиль доступен по адресу:

```
https://ecotrackr.com/u/{username}
https://ecotrackr.com/u/{username}?period=month
```

| Параметр | Описание |
|----------|----------|
| `username` | Уникальный slug из **Settings → Account** |
| `period` | `week` · `month` · `year` · `all` — фильтр периода |

**Как включить:** Dashboard → Settings → Account → переключатель «Публичный профиль» + username → Save → Copy link.

**Приватность:** opt-in (`is_public`). RLS в Supabase отдаёт только агрегированную статистику публичных профилей. Миграция: [`supabase/migrations/20260703_public_profiles.sql`](supabase/migrations/20260703_public_profiles.sql).

---

## 🛠 Tech Stack

### Frontend

| Технология | Роль |
|------------|------|
| [Next.js 15](https://nextjs.org/) | App Router, SSR/CSR, middleware |
| [React 19](https://react.dev/) | UI, hooks, concurrent features |
| [TypeScript](https://www.typescriptlang.org/) | Strict typing |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first стили |
| [shadcn/ui](https://ui.shadcn.com/) | Radix-примитивы (radix-nova) |
| [Framer Motion](https://www.framer.com/motion/) | Анимации лендинга и переходов |
| [Recharts](https://recharts.org/) | Графики на дашборде |
| [Leaflet](https://leafletjs.com/) + react-leaflet | Карта активностей (OpenStreetMap) |
| [Lucide React](https://lucide.dev/) | Иконки |
| [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator) | Калькулятор CO₂e на дашборде (формы, графики, коэффициенты выбросов) |

### Backend & Data

| Технология | Роль |
|------------|------|
| [Supabase](https://supabase.com/) | Auth, PostgreSQL, RLS |
| [Google Gemini](https://ai.google.dev/) | AI-рекомендации (`/api/ai-insights`) |

### i18n & PWA

| Технология | Роль |
|------------|------|
| [i18next](https://www.i18next.com/) + react-i18next | Локализация en/ru |
| Service Worker (`public/sw.js`) | Кэширование, offline |
| Web App Manifest (`app/manifest.json`) | Установка как PWA |

### Качество кода

| Технология | Роль |
|------------|------|
| [Vitest](https://vitest.dev/) | Unit/integration тесты |
| [Testing Library](https://testing-library.com/) | Тесты React-компонентов |
| [ESLint](https://eslint.org/) | Линтинг (jsx-a11y, react-hooks) |

### Web Workers

Тяжёлые вычисления вынесены из main thread:

- `leaderboard-worker.js` — ранжирование участников
- `export-worker.js` — генерация CSV/JSON/HTML

---

## 📦 CO₂ Calculator

Калькулятор углеродного следа вынесен в отдельный open-source пакет **[`@ecotrackr/co2-calculator`](https://github.com/CodingJulie/co2-calculator)** — его можно использовать и в других React-проектах.

В EcoTrackr пакет подключается через тонкую обёртку `components/calculator/CO2Calculator.tsx`, которая передаёт Supabase-клиент, функцию перевода `t` из i18next и колбэки для обновления дашборда:

```tsx
import { CO2Calculator as PackageCO2Calculator } from '@ecotrackr/co2-calculator';

<PackageCO2Calculator
  supabase={supabase}
  t={t}
  onEntryAdded={handleDataChange}
  onEntryDeleted={handleDataChange}
/>
```

- **Репозиторий:** [github.com/CodingJulie/co2-calculator](https://github.com/CodingJulie/co2-calculator)
- **npm:** `@ecotrackr/co2-calculator`

---

## 🏗 Architecture Decisions

### 1. Next.js App Router + Client-Side Supabase

Данные пользователя загружаются напрямую из браузера через `@/lib/supabase`. **Server Actions не используются** — проще деплой, меньше серверной логики. Защита маршрутов — в `middleware.ts` через `supabase.auth.getUser()`.

### 2. Единственный API Route

Серверный код сведён к **`POST /api/ai-insights`**. Секрет `GEMINI_API_KEY` никогда не попадает на клиент. Все CRUD-операции — через Supabase с RLS.

### 3. i18n без locale-префиксов

Язык хранится в `localStorage` (`i18nextLng`) — URL без locale-префиксов.

### 4. Dynamic Import + `ssr: false`

Калькулятор, карты, Leaflet, AI Insights загружаются через `next/dynamic` с отключённым SSR — избегаем `window is not defined` и уменьшаем initial bundle.

### 5. Web Workers для CPU-bound задач

Лидерборд и экспорт — в отдельных workers через singleton `WorkersManager`. Main thread остаётся отзывчивым.

### 6. PWA-first

Service Worker регистрируется на клиенте (`ServiceWorkerRegister`). Manifest с иконками и screenshots для «Add to Home Screen».

### 7. Безопасность в Middleware

CSP, HSTS, `X-Frame-Options: DENY`, COOP — заголовки добавляются централизованно для всех маршрутов.

### 8. Коэффициенты выбросов

UI калькулятора и расчёты CO₂e — в пакете [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator). Не дублируйте коэффициенты в компонентах.

```mermaid
flowchart LR
    subgraph Client
        UI[React Components]
        SW[Service Worker]
        WW[Web Workers]
    end

    subgraph Server
        API["/api/ai-insights"]
        MW[middleware.ts]
    end

    subgraph External
        SB[(Supabase)]
        GM[Google Gemini]
    end

    UI --> SB
    UI --> WW
    UI --> API
    API --> GM
    MW --> SB
    SW --> UI
```

---

## 📁 Структура проекта

```
ecotrackr/
├── app/                          # Next.js App Router
│   ├── api/ai-insights/          # Единственный API route (Gemini)
│   ├── dashboard/                # Защищённая зона
│   │   ├── page.tsx              # Главный дашборд
│   │   ├── community/            # Лидерборд
│   │   └── settings/             # Профиль, пароль, удаление аккаунта
│   ├── login/                    # Auth-страницы
│   ├── register/
│   ├── forgot-password/
│   ├── update-password/
│   ├── privacy/ · terms/         # Юридические страницы
│   ├── u/[username]/             # Публичный shareable-профиль
│   ├── layout.tsx                # Root layout + providers + SEO / Open Graph
│   ├── page.tsx                  # Landing
│   ├── manifest.json             # PWA manifest
│   ├── sitemap.ts · robots.ts
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn-примитивы (Button, Card, …)
│   ├── calculator/               # Обёртка над @ecotrackr/co2-calculator
│   ├── charts/                   # EmissionsTrend
│   ├── dashboard/                # AutoGenerationWidget
│   ├── forest/                   # UserTree, CommunityForest
│   ├── insights/                 # AIInsights
│   ├── maps/                     # OpenStreetMap
│   ├── workers/                  # WorkersManager, SW register
│   └── providers/                # I18nProvider
│
├── hooks/
│   └── useDashboardData.ts       # Агрегация данных дашборда
│
├── lib/
│   ├── supabase.ts               # Browser Supabase client
│   ├── utils.ts                  # cn(), formatDate, emission factors
│   ├── i18n.js                   # i18next config
│   └── site.ts                   # getSiteUrl()
│
├── public/
│   ├── locales/en|ru/common.json # Переводы
│   ├── workers/                  # Web Workers (plain JS)
│   ├── sw.js                     # Service Worker
│   ├── offline.html
│   └── screenshot-*.png          # PWA / README screenshots
│
├── middleware.ts                 # Auth guard, CSP, locale redirect
├── .env.example                  # Шаблон переменных окружения
├── LICENSE                       # MIT
└── vitest.config.ts
```

### Supabase-таблицы

| Таблица | Назначение |
|---------|------------|
| `footprint_entries` | Записи CO₂e (`user_id`, `co2e`, `date`, `category`, `activity`, `value`) |
| `profiles` | Профиль (`name`, `avatar_url`, `username`, `is_public`) |
| `user_trees` | Геймификация (`tree_level`, `total_co2_saved`) |
| `community_forest` | Общий лес (`total_trees`) |
| `user_map_points` | Гео-точки на карте |

---

## 📚 Документация

### Переменные окружения

Скопируйте [`.env.example`](.env.example) в `.env.local`:

```bash
cp .env.example .env.local
```

| Переменная | Обязательна | Описание |
|------------|:-----------:|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL Supabase-проекта |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | — | Базовый URL (sitemap, OG, shareable links) |
| `GEMINI_API_KEY` | — | Google Gemini для AI Insights |

### Команды

```bash
npm run dev          # Dev-сервер → http://localhost:3000
npm run build        # Production build
npm run start        # Запуск production
npm run test         # Vitest (watch)
npm run test:ci      # Vitest + coverage (CI)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

### Локализация

1. Добавьте ключ в **snake_case** в оба файла:
   - `public/locales/en/common.json`
   - `public/locales/ru/common.json`
2. Используйте: `const { t } = useTranslation('common');`
3. Переключатель языка: `components/ui/LanguageSwitcher.tsx`

### Тестирование

```bash
npm run test                    # watch mode
npm run test -- route.test.ts   # один файл
npm run test:coverage           # отчёт покрытия
```

Co-located тесты: `*.test.ts(x)` рядом с исходниками, workers — `public/workers/*.test.js`.

### Cursor Rules

В `.cursor/rules/` — конвенции проекта для AI-ассистентов: Supabase, i18n, Web Workers, UI, тесты.

---

## 🔌 API

EcoTrackr экспонирует **один** серверный endpoint. Все остальные данные — через Supabase client + RLS.

### `POST /api/ai-insights`

Генерирует 4 персональных совета по снижению углеродного следа на основе данных пользователя.

**Request**

```http
POST /api/ai-insights
Content-Type: application/json
```

```json
{
  "totalCO2": 245.5,
  "entries": [
    {
      "category": "transport",
      "activity": "car_petrol",
      "value": 50,
      "co2e": 9.6
    }
  ],
  "refresh": false,
  "lang": "ru"
}
```

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `totalCO2` | `number` | — | Суммарный след, кг CO₂e |
| `entries` | `array` | `[]` | Последние активности |
| `refresh` | `boolean` | `false` | Случайный prompt template |
| `lang` | `"en"` \| `"ru"` | `"en"` | Язык fallback-советов |

**Response `200`**

```json
{
  "insights": [
    "🚗 Попробуйте добираться до работы на велосипеде...",
    "💡 Замените лампы накаливания на светодиодные...",
    "🥩 Устройте один вегетарианский день в неделю...",
    "♻️ Начните сортировать отходы..."
  ],
  "model": "gemini-2.0-flash-exp",
  "cached": false
}
```

**Response при ошибке / без API-ключа**

```json
{
  "insights": ["...", "...", "...", "..."],
  "cached": false,
  "error": "API key missing"
}
```

> Fallback-советы локализованы через `lang`. Клиент: `components/insights/AIInsights.tsx`.

**Пример вызова**

```bash
curl -X POST http://localhost:3000/api/ai-insights \
  -H "Content-Type: application/json" \
  -d '{"totalCO2": 100, "entries": [], "lang": "ru"}'
```

### Supabase (клиентский доступ)

Прямые запросы из браузера — см. `hooks/useDashboardData.ts`:

```typescript
const { data } = await supabase
  .from('footprint_entries')
  .select('id, co2e, date, category, activity, value')
  .eq('user_id', userId)
  .order('date', { ascending: false });
```

RLS-политики должны ограничивать доступ: пользователь видит только свои записи.

---

## 🚀 Быстрый старт

### Требования

- Node.js 20+
- npm (или pnpm/yarn)
- Supabase-проект с таблицами (см. [Supabase-таблицы](#supabase-таблицы))

### Установка

```bash
git clone https://github.com/CodingJulie/ecotrackr.git
cd ecotrackr
cp .env.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_* в .env.local

npm install --legacy-peer-deps   # peer deps framer-motion (см. @ecotrackr/co2-calculator)
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

---

## 🤝 Contributing

1. Fork репозитория
2. Создайте ветку: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Откройте Pull Request

Перед PR: `npm run lint && npm run type-check && npm run test:ci`

---

## 📄 Лицензия

Распространяется под [MIT License](LICENSE).

Copyright © 2026 [Julie](https://github.com/CodingJulie)

---

<div align="center">

**Сделано с 🌱 для планеты**

[⬆ Наверх](#ecotrackr)

</div>
