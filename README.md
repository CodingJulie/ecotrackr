# EcoTrackr — Трекинг углеродного следа

Современное open-source приложение для расчёта и снижения личного углеродного следа.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-38bdf8)

## ✨ Возможности

- Реал-тайм калькулятор CO₂e (транспорт, энергия, питание, покупки)
- Красивые дашборды и визуализации
- Gamification: стрики, бейджи, лидерборд
- AI Insights (Grok / OpenAI)
- Экспорт PDF-отчётов
- PWA + offline-режим
- Supabase Auth + Database

## Технологии

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Стили**: Tailwind CSS + shadcn/ui + Tremor
- **Анимации**: Framer Motion
- **Формы**: React Hook Form + Zod
- **БД**: Supabase
- **State**: Zustand + TanStack Query
- **Charts**: Recharts / Tremor

## Быстрый старт

```bash
git clone https://github.com/yourusername/ecotrackr.git
cd ecotrackr
cp .env.example .env.local
pnpm install
pnpm dev