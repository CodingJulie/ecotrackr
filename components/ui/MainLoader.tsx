'use client';

import { Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MainLoader() {
    const { t } = useTranslation('common');

    return (
            <div className="text-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-200 dark:border-emerald-900 rounded-full animate-pulse" />
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-emerald-600 rounded-full animate-spin border-t-transparent" />
                    <Leaf className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
                <p className="mt-6 text-lg font-medium text-zinc-900 dark:text-white">
                    {t('main_loader_title')}
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t('main_loader_subtitle')}
                </p>
            </div>
    );
}