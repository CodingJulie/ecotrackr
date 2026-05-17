'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { initAuthSessionCache } from '@/lib/auth-client';

export default function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initAuthSessionCache();
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="theme"
        >
            {children}
        </ThemeProvider>
    );
}
