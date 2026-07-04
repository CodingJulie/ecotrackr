'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function InstallButton({ iconOnly = false }: { iconOnly?: boolean }) {
    const { t } = useTranslation('common');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        console.log('InstallButton mounted');
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                console.log('✅ Пользователь установил PWA');
            }
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    console.log('isInstallable', isInstallable);

    if (!isInstallable) return null;

    if (iconOnly) {
        return (
            <Button
                onClick={handleInstall}
                variant="outline"
                size="icon"
                aria-label={t('install_app')}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
                <Download className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <Button
            onClick={handleInstall}
            variant="outline"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        >
            <Download className="w-4 h-4" />
            {t('install_app')}
        </Button>
    );
}