// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { cn } from "@/lib/utils";
import ClientWorkersManager from '@/components/workers/ClientWorkersManager';
import ServiceWorkerRegister from "@/components/workers/ServiceWorkerRegister";
import I18nProvider from '@/components/providers/I18nProvider';
import { getSiteUrl } from '@/lib/site';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    title: {
        default: 'EcoTrackr - Трекер углеродного следа',
        template: '%s | EcoTrackr'
    },
    description: 'Отслеживайте свой углеродный след, получайте персональные советы ИИ и вдохновляйте других на заботу о планете.',
    keywords: ['углеродный след', 'CO2', 'экология', 'климат', 'эко-трекер'],
    authors: [{ name: 'EcoTrackr Team' }],
    creator: 'EcoTrackr',
    publisher: 'EcoTrackr',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: 'EcoTrackr - Твой персональный трекер углеродного следа',
        description: 'Следите за своим воздействием на планету',
        url: getSiteUrl(),
        siteName: 'EcoTrackr',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EcoTrackr' }],
        type: 'website',
        locale: 'ru_RU',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EcoTrackr - Твой персональный трекер углеродного следа',
        description: 'Следите за своим воздействием на планету',
        images: ['/og-image.png'],
    },
    category: 'lifestyle',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: '#059669',
    colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
        <head>
            <meta charSet="UTF-8" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="EcoTrackr" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="msapplication-TileColor" content="#059669" />
            <meta name="msapplication-tap-highlight" content="no" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://fgvghjbdifuipretksy.supabase.co" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
            <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
            <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={inter.className}>
        <I18nProvider>
            <Providers>
                {children}
                <ClientWorkersManager />
                <ServiceWorkerRegister />
            </Providers>
        </I18nProvider>
        </body>
        </html>
    );
}