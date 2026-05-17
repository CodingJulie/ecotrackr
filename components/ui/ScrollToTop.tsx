'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ScrollToTop() {
    const { t } = useTranslation('common');
    const [show, setShow] = useState(false);

    useEffect(() => {
        const onScroll = () => setShow(window.scrollY > 500);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!show) return null;

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 p-3 text-white shadow-lg transition-colors hover:bg-emerald-700 dark:shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
            aria-label={t('scroll_to_top_aria')}
        >
            <ChevronUp className="h-6 w-6" />
        </button>
    );
}
