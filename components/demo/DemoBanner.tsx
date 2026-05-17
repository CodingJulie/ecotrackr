'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import en from '@/public/locales/en/common.json';

export default function DemoBanner() {
    const { t } = useTranslation('common');
    const hydrated = useHydrated();
    const [dismissed, setDismissed] = useState(false);

    const copy = hydrated
        ? {
            banner: t('demo.banner_text'),
            createAccount: t('demo.create_account'),
            dismiss: t('demo.dismiss'),
        }
        : {
            banner: en.demo.banner_text,
            createAccount: en.demo.create_account,
            dismiss: en.demo.dismiss,
        };

    if (dismissed) return null;

    return (
        <div className="sticky top-0 z-[60] border-b border-emerald-200 dark:border-emerald-800 bg-emerald-50/95 dark:bg-emerald-950/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
                    <p className="text-sm text-emerald-900 dark:text-emerald-100 truncate">
                        {copy.banner}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/register">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            {copy.createAccount}
                            <ArrowRight className="ml-1.5 w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDismissed(true)}
                        aria-label={copy.dismiss}
                        className="text-emerald-700 dark:text-emerald-300"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
