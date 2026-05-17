'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGS = ['en', 'ru'] as const;

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { i18n } = useTranslation('common');

    const changeLanguage = (lang: (typeof LANGS)[number]) => {
        void i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    return (
        <div className={cn('flex gap-1', compact && 'flex-col')}>
            {LANGS.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    onClick={() => changeLanguage(lang)}
                    className={cn(
                        compact
                            ? 'h-7 w-8 rounded-lg text-xs font-medium'
                            : 'rounded px-3 py-1 text-sm',
                        i18n.language === lang
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600',
                    )}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
