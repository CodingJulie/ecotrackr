import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EcoTrackr — Трекинг углеродного следа',
    description: 'Снижай свой углеродный след с умом. Красивый калькулятор CO₂, AI-рекомендации и геймификация.',
    keywords: ['углеродный след', 'CO2', 'экология', 'климат', 'устойчивость', 'carbon footprint'],
    authors: [{ name: 'Julia T' }],
    openGraph: {
        title: 'EcoTrackr — Следи и снижай свой углеродный след',
        description: 'Приложение для осознанного потребления и борьбы с изменением климата.',
        images: [
            {
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'EcoTrackr Dashboard',
            },
        ],
        locale: 'ru_RU',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EcoTrackr — Трекинг углеродного следа',
        description: 'Снижай свой CO₂ след каждый день',
        images: ['/images/og-image.jpg'],
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    other: {
        'preconnect': 'https://fgvghjbdifuipretksy.supabase.co',
    },
};