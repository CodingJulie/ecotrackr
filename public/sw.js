// public/sw.js
const CACHE_NAME = 'ecotrackr-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Install');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activate');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});