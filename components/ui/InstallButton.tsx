'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallButton({ iconOnly = false }: { iconOnly?: boolean }) {
    const { t } = useTranslation('common');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };

    if (!deferredPrompt) return null;

    return (
        <Button
            onClick={handleInstall}
            variant="outline"
            size={iconOnly ? 'icon' : 'default'}
            aria-label={t('install_app')}
            className={cn(
                'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30',
                !iconOnly && 'gap-2',
            )}
        >
            <Download className="w-4 h-4" />
            {!iconOnly && t('install_app')}
        </Button>
    );
}
