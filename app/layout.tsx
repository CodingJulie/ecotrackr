import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { cn } from "@/lib/utils";
import ClientWorkersManager from '@/components/workers/ClientWorkersManager';
import ServiceWorkerRegister from "@/components/workers/ServiceWorkerRegister";
import I18nProvider from '@/components/providers/I18nProvider';
import { getSiteUrl } from '@/lib/site';
import { getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase-env';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    title: {
        default: 'EcoTrackr - Carbon Footprint Tracker',
        template: '%s | EcoTrackr'
    },
    description:
        'Track your carbon footprint, get personalized AI tips, and inspire others to care for the planet.',
    keywords: [
        'carbon footprint',
        'CO2',
        'climate',
        'eco tracker',
        'sustainability',
        'углеродный след',
        'экология',
        'климат',
        'эко-трекер',
    ],
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
        title: 'EcoTrackr - Your Personal Carbon Footprint Tracker',
        description: 'Track your impact on the planet',
        url: getSiteUrl(),
        siteName: 'EcoTrackr',
        images: [
            {
                url: '/screenshot-desktop-light-en.png',
                width: 2444,
                height: 11470,
                alt: 'EcoTrackr dashboard — carbon footprint tracker (English, light theme)',
            },
            {
                url: '/screenshot-desktop-dark-en.png',
                width: 2444,
                height: 11470,
                alt: 'EcoTrackr dashboard (English, dark theme)',
            },
            {
                url: '/screenshot-desktop-light-ru.png',
                width: 2444,
                height: 11470,
                alt: 'EcoTrackr — трекер углеродного следа (русский, светлая тема)',
            },
            {
                url: '/screenshot-desktop-dark-ru.png',
                width: 2444,
                height: 11470,
                alt: 'EcoTrackr — дашборд (русский, тёмная тема)',
            },
        ],
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['ru_RU'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'EcoTrackr - Your Personal Carbon Footprint Tracker',
        description: 'Track your impact on the planet',
        images: [
            '/screenshot-desktop-light-en.png',
            '/screenshot-desktop-dark-en.png',
            '/screenshot-desktop-light-ru.png',
            '/screenshot-desktop-dark-ru.png',
        ],
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
    const supabasePreconnect = isSupabaseConfigured() ? getSupabaseUrl() : null;

    return (
        <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
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
            {supabasePreconnect ? (
                <link rel="preconnect" href={supabasePreconnect} />
            ) : null}
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