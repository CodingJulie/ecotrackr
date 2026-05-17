'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BarChart3, Leaf, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import DemoBanner from '@/components/demo/DemoBanner';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation('common');
    const { resolvedTheme, setTheme } = useTheme();
    const [themeMounted, setThemeMounted] = useState(false);

    useEffect(() => {
        setThemeMounted(true);
    }, []);

    const isDark = themeMounted && resolvedTheme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <DemoBanner />

            <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
                        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl md:text-2xl tracking-tight">{t('app_name')}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium">
                            <BarChart3 className="w-4 h-4" />
                            {t('dashboard')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? t('switch_to_light_theme') : t('switch_to_dark_theme')}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                        <LanguageSwitcher />
                        <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-medium">
                                E
                            </AvatarFallback>
                        </Avatar>
                        <Link href="/register" className="hidden sm:block">
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                {t('landing.nav.start_free')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 lg:p-10">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
