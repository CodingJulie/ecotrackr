'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Leaf } from 'lucide-react';

export default function NotFound() {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 dark:bg-zinc-950 px-6">
            <Link href="/" className="inline-block mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight">{t('app_name')}</span>
                </div>
            </Link>

            <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">{t('page_not_found')}</h2>
            <p className="text-muted-foreground mb-8 text-center">
                {t('page_not_found_desc')}
            </p>
            <Link href="/">
                <Button>{t('back_to_home')}</Button>
            </Link>
        </div>
    );
}
