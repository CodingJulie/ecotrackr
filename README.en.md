<div align="center">

# <img src="public/leaf.png" alt="" width="36" height="36" style="vertical-align: -0.15em;" /> EcoTrackr

[Русский](README.md) · **English**

**Open-source PWA for tracking and reducing your personal carbon footprint (CO₂e)**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

[Website](https://ecotrackr-beta.vercel.app/) · [Live demo](https://ecotrackr-beta.vercel.app/demo) · [Quick start](#-quick-start) · [API](#-api) · [License](#-license)

</div>

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><strong>Dashboard (desktop)</strong></td>
    <td align="center"><strong>Mobile</strong></td>
  </tr>
  <tr>
    <td>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screenshot-desktop-dark-en.png" />
        <source media="(prefers-color-scheme: light)" srcset="public/screenshot-desktop-light-en.png" />
        <img src="public/screenshot-desktop-light-en.png" alt="EcoTrackr dashboard on desktop" width="100%" />
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

> Screenshots switch between light and dark themes based on GitHub / system preferences. They are also used in the PWA manifest (`app/manifest.json`) for Add to Home Screen.

---

## 📖 About

**EcoTrackr** is a modern web app for mindful consumption and climate action. Users log everyday activities (transport, food, energy, purchases), get real-time CO₂e calculations, and track progress on clear dashboards.

### Who it's for

- **Individuals** who want to understand their real carbon footprint
- **Eco communities** — leaderboard and shared “community forest”
- **Developers** — open stack, clear architecture, ready Web Workers and PWA

### Key features

| Category | What it does |
|----------|--------------|
| **CO₂e calculator** | Transport, food, energy, purchases, household — UI and calculations from the npm package [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator) |
| **Dashboard** | KPI cards, trends, activity map, gamification (tree, forest) |
| **AI Insights** | Personal tips via Google Gemini with a fallback when no API key is set |
| **Community** | Participant leaderboard, aggregated stats |
| **Export** | PDF, HTML, CSV, JSON — reports for personal archive or sharing |
| **PWA** | Installable app, Service Worker, offline page |
| **i18n** | Russian and English (i18next, no URL prefixes) |
| **Auth** | Sign up, sign in, password reset via Supabase Auth |

---

## 🔗 Shareable profile and results links

EcoTrackr supports several ways to share your eco progress:

### 1. Report export (implemented)

On the dashboard, **Export** generates files with your data:

| Format | Purpose |
|--------|---------|
| **PDF** | Polished report for social media, CV, portfolio |
| **HTML** | Interactive page — open in a browser and send |
| **CSV / JSON** | Data for spreadsheets, analytics, integrations |

Files are saved locally as `ecotrackr-data-YYYY-MM-DD.{format}`.

### 2. Public leaderboard (implemented)

The **`/dashboard/community`** page shows aggregated participant stats: name, total CO₂e, entry count, medals. No detailed activities — only totals for a competitive feel.

### 3. Shareable profile URL (implemented)

Public profiles are available at:

```
https://ecotrackr.com/u/{username}
https://ecotrackr.com/u/{username}?period=month
```

| Parameter | Description |
|-----------|-------------|
| `username` | Unique slug from **Settings → Account** |
| `period` | `week` · `month` · `year` · `all` — period filter |

**How to enable:** Dashboard → Settings → Account → “Public profile” toggle + username → Save → Copy link.

**Privacy:** opt-in (`is_public`). Supabase RLS returns only aggregated stats for public profiles. Migration: [`supabase/migrations/20260703_public_profiles.sql`](supabase/migrations/20260703_public_profiles.sql).

---

## 🛠 Tech Stack

### Frontend

| Technology | Role |
|------------|------|
| [Next.js 15](https://nextjs.org/) | App Router, SSR/CSR, middleware |
| [React 19](https://react.dev/) | UI, hooks, concurrent features |
| [TypeScript](https://www.typescriptlang.org/) | Strict typing |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styles |
| [shadcn/ui](https://ui.shadcn.com/) | Radix primitives (radix-nova) |
| [Framer Motion](https://www.framer.com/motion/) | Landing and transition animations |
| [Recharts](https://recharts.org/) | Dashboard charts |
| [Leaflet](https://leafletjs.com/) + react-leaflet | Activity map (OpenStreetMap) |
| [Lucide React](https://lucide.dev/) | Icons |
| [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator) | CO₂e calculator on the dashboard (forms, charts, emission factors) |

### Backend & Data

| Technology | Role |
|------------|------|
| [Supabase](https://supabase.com/) | Auth, PostgreSQL, RLS |
| [Google Gemini](https://ai.google.dev/) | AI recommendations (`/api/ai-insights`) |

### i18n & PWA

| Technology | Role |
|------------|------|
| [i18next](https://www.i18next.com/) + react-i18next | en/ru localization |
| Service Worker (`public/sw.js`) | Caching, offline |
| Web App Manifest (`app/manifest.json`) | Install as PWA |

### Code quality

| Technology | Role |
|------------|------|
| [Vitest](https://vitest.dev/) | Unit/integration tests |
| [Testing Library](https://testing-library.com/) | React component tests |
| [ESLint](https://eslint.org/) | Linting (jsx-a11y, react-hooks) |

### Web Workers

Heavy work is off the main thread:

- `leaderboard-worker.js` — participant ranking
- `export-worker.js` — CSV/JSON/HTML generation

---

## 📦 CO₂ Calculator

The carbon footprint calculator lives in a separate open-source package **[`@ecotrackr/co2-calculator`](https://github.com/CodingJulie/co2-calculator)** — reusable in other React projects.

In EcoTrackr it is wired through a thin wrapper `components/calculator/CO2Calculator.tsx`, which passes the Supabase client, the i18next `t` function, and dashboard refresh callbacks:

```tsx
import { CO2Calculator as PackageCO2Calculator } from '@ecotrackr/co2-calculator';

<PackageCO2Calculator
  supabase={supabase}
  t={t}
  onEntryAdded={handleDataChange}
  onEntryDeleted={handleDataChange}
/>
```

- **Repository:** [github.com/CodingJulie/co2-calculator](https://github.com/CodingJulie/co2-calculator)
- **npm:** `@ecotrackr/co2-calculator`

---

## 🏗 Architecture Decisions

### 1. Next.js App Router + Client-Side Supabase

User data is loaded from the browser via `@/lib/supabase`. **Server Actions are not used** — simpler deploy, less server logic. Route protection is in `middleware.ts` via `supabase.auth.getUser()`.

### 2. Single API Route

Server code is limited to **`POST /api/ai-insights`**. The `GEMINI_API_KEY` secret never reaches the client. All CRUD goes through Supabase with RLS.

### 3. i18n without locale prefixes

Language is stored in `localStorage` (`i18nextLng`) — URLs without locale prefixes.

### 4. Dynamic Import + `ssr: false`

Calculator, maps, Leaflet, and AI Insights load via `next/dynamic` with SSR off — avoids `window is not defined` and shrinks the initial bundle.

### 5. Web Workers for CPU-bound work

Leaderboard and export run in workers via a singleton `WorkersManager`. The main thread stays responsive.

### 6. PWA-first

The Service Worker is registered on the client (`ServiceWorkerRegister`). Manifest includes icons and screenshots for “Add to Home Screen”.

### 7. Security in Middleware

CSP, HSTS, `X-Frame-Options: DENY`, COOP — headers are applied centrally for all routes.

### 8. Emission factors

Calculator UI and CO₂e math live in [@ecotrackr/co2-calculator](https://github.com/CodingJulie/co2-calculator). Do not duplicate factors in components.

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

## 📁 Project structure

```
ecotrackr/
├── app/                          # Next.js App Router
│   ├── api/ai-insights/          # Single API route (Gemini)
│   ├── dashboard/                # Protected area
│   │   ├── page.tsx              # Main dashboard
│   │   ├── community/            # Leaderboard
│   │   └── settings/             # Profile, password, account deletion
│   ├── login/                    # Auth pages
│   ├── register/
│   ├── forgot-password/
│   ├── update-password/
│   ├── privacy/ · terms/         # Legal pages
│   ├── u/[username]/             # Public shareable profile
│   ├── layout.tsx                # Root layout + providers + SEO / Open Graph
│   ├── page.tsx                  # Landing
│   ├── manifest.json             # PWA manifest
│   ├── sitemap.ts · robots.ts
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn primitives (Button, Card, …)
│   ├── calculator/               # Wrapper around @ecotrackr/co2-calculator
│   ├── charts/                   # EmissionsTrend
│   ├── dashboard/                # AutoGenerationWidget
│   ├── forest/                   # UserTree, CommunityForest
│   ├── insights/                 # AIInsights
│   ├── maps/                     # OpenStreetMap
│   ├── workers/                  # WorkersManager, SW register
│   └── providers/                # I18nProvider
│
├── hooks/
│   └── useDashboardData.ts       # Dashboard data aggregation
│
├── lib/
│   ├── supabase.ts               # Browser Supabase client
│   ├── utils.ts                  # cn(), formatDate, emission factors
│   ├── i18n.js                   # i18next config
│   └── site.ts                   # getSiteUrl()
│
├── public/
│   ├── locales/en|ru/common.json # Translations
│   ├── workers/                  # Web Workers (plain JS)
│   ├── sw.js                     # Service Worker
│   ├── offline.html
│   └── screenshot-*.png          # PWA / README screenshots
│
├── middleware.ts                 # Auth guard, CSP, locale redirect
├── .env.example                  # Env template
├── LICENSE                       # MIT
└── vitest.config.ts
```

### Supabase tables

| Table | Purpose |
|-------|---------|
| `footprint_entries` | CO₂e entries (`user_id`, `co2e`, `date`, `category`, `activity`, `value`) |
| `profiles` | Profile (`name`, `avatar_url`, `username`, `is_public`) |
| `user_trees` | Gamification (`tree_level`, `total_co2_saved`) |
| `community_forest` | Shared forest (`total_trees`) |
| `user_map_points` | Map geo points |

---

## 📚 Documentation

### Environment variables

Copy [`.env.example`](.env.example) to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | — | Base URL (sitemap, OG, shareable links) |
| `GEMINI_API_KEY` | — | Google Gemini for AI Insights |

### Commands

```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run start        # Run production
npm run test         # Vitest (watch)
npm run test:ci      # Vitest + coverage (CI)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

### Localization

1. Add a **snake_case** key to both files:
   - `public/locales/en/common.json`
   - `public/locales/ru/common.json`
2. Use: `const { t } = useTranslation('common');`
3. Language switcher: `components/ui/LanguageSwitcher.tsx`

### Testing

```bash
npm run test                    # watch mode
npm run test -- route.test.ts   # single file
npm run test:coverage           # coverage report
```

Co-located tests: `*.test.ts(x)` next to sources; workers — `public/workers/*.test.js`.

### Cursor Rules

`.cursor/rules/` holds project conventions for AI assistants: Supabase, i18n, Web Workers, UI, tests.

---

## 🔌 API

EcoTrackr exposes **one** server endpoint. Everything else goes through the Supabase client + RLS.

### `POST /api/ai-insights`

Generates 4 personal tips to reduce carbon footprint from user data.

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
  "lang": "en"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `totalCO2` | `number` | — | Total footprint, kg CO₂e |
| `entries` | `array` | `[]` | Recent activities |
| `refresh` | `boolean` | `false` | Random prompt template |
| `lang` | `"en"` \| `"ru"` | `"en"` | Language for fallback tips |

**Response `200`**

```json
{
  "insights": [
    "🚗 Try commuting by bike...",
    "💡 Replace incandescent bulbs with LEDs...",
    "🥩 Have one vegetarian day a week...",
    "♻️ Start sorting your waste..."
  ],
  "model": "gemini-2.0-flash-exp",
  "cached": false
}
```

**Response on error / missing API key**

```json
{
  "insights": ["...", "...", "...", "..."],
  "cached": false,
  "error": "API key missing"
}
```

> Fallback tips are localized via `lang`. Client: `components/insights/AIInsights.tsx`.

**Example**

```bash
curl -X POST http://localhost:3000/api/ai-insights \
  -H "Content-Type: application/json" \
  -d '{"totalCO2": 100, "entries": [], "lang": "en"}'
```

### Supabase (client access)

Direct browser queries — see `hooks/useDashboardData.ts`:

```typescript
const { data } = await supabase
  .from('footprint_entries')
  .select('id, co2e, date, category, activity, value')
  .eq('user_id', userId)
  .order('date', { ascending: false });
```

RLS policies must restrict access: users only see their own entries.

---

## 🚀 Quick start

### Requirements

- Node.js 20+
- npm (or pnpm/yarn)
- A Supabase project with tables (see [Supabase tables](#supabase-tables))

### Setup

```bash
git clone https://github.com/CodingJulie/ecotrackr.git
cd ecotrackr
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_* in .env.local

npm install --legacy-peer-deps   # peer deps framer-motion (see @ecotrackr/co2-calculator)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

Before a PR: `npm run lint && npm run type-check && npm run test:ci`

---

## 📄 License

Released under the [MIT License](LICENSE).

Copyright © 2026 [Julie](https://github.com/CodingJulie)

---

<div align="center">

**Made with 🌱 for the planet**

[⬆ Back to top](#ecotrackr)

</div>
