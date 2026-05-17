'use client';

import { useEffect } from 'react';

async function clearServiceWorkerCaches() {
    if (!('caches' in window)) return;

    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
}

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        if (process.env.NODE_ENV === 'development') {
            void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
                await Promise.all(registrations.map((registration) => registration.unregister()));
                await clearServiceWorkerCaches();
            });
            return;
        }

        navigator.serviceWorker
            .register('/sw.js')
            .catch((err) => console.error('SW registration failed:', err));
    }, []);

    return null;
}