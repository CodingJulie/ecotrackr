'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { i18n } = useTranslation('common');

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lang);
        }
    };

    const buttonClass = (lang: string) =>
        compact
            ? `w-8 h-7 text-xs font-medium rounded-lg ${
                i18n.language === lang
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
            }`
            : `px-3 py-1 text-sm rounded ${
                i18n.language === lang
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
            }`;

    return (
        <div className={compact ? 'flex flex-col gap-1' : 'flex gap-1'}>
            <button onClick={() => changeLanguage('en')} className={buttonClass('en')}>
                EN
            </button>
            <button onClick={() => changeLanguage('ru')} className={buttonClass('ru')}>
                RU
            </button>
        </div>
    );
}