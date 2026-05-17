const CACHE_NAME = 'ecotrackr-v7';
const OFFLINE_URL = '/offline.html';
const DASHBOARD_SHELL_URL = '/__ecotrackr_dashboard_shell__';
const PRECACHE_URLS = [OFFLINE_URL];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

function isNavigationRequest(request) {
    return (
        request.mode === 'navigate' ||
        (request.method === 'GET' &&
            (request.headers.get('accept') || '').includes('text/html'))
    );
}

function isDashboardPath(pathname) {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

function isNextStaticAsset(pathname) {
    return pathname.startsWith('/_next/static/');
}

function shouldUseCacheFirst(pathname) {
    return isDashboardPath(pathname);
}

const CACHE_MATCH_OPTIONS = { ignoreSearch: true, ignoreVary: true };

function offlineResponse() {
    return new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}

function dashboardRootRequest(origin) {
    return new Request(new URL('/dashboard', origin).href);
}

function dashboardShellRequest(origin) {
    return new Request(new URL(DASHBOARD_SHELL_URL, origin).href);
}

function offlineRedirect(returnTo) {
    const offlineUrl = new URL(OFFLINE_URL, self.location.origin);
    if (returnTo) {
        offlineUrl.searchParams.set('returnTo', returnTo);
    }
    return Response.redirect(offlineUrl.toString(), 307);
}

async function putInCache(cache, request, response) {
    if (!response.ok) return;

    await cache.put(request, response.clone());

    const url = new URL(request.url);
    if (!isDashboardPath(url.pathname) || !isNavigationRequest(request)) return;

    const shellRequest = dashboardShellRequest(url.origin);
    const rootRequest = dashboardRootRequest(url.origin);

    await cache.put(shellRequest, response.clone());
    if (url.pathname !== '/dashboard') {
        await cache.put(rootRequest, response.clone());
    }
}

async function findDashboardFallback(cache, request) {
    const url = new URL(request.url);
    const origin = url.origin;

    const cached = await cache.match(request, CACHE_MATCH_OPTIONS);
    if (cached) return cached;

    const shell = await cache.match(dashboardShellRequest(origin), CACHE_MATCH_OPTIONS);
    if (shell) return shell;

    const dashboardRoot = await cache.match(dashboardRootRequest(origin), CACHE_MATCH_OPTIONS);
    if (dashboardRoot) return dashboardRoot;

    const keys = await cache.keys();
    for (const key of keys) {
        const keyUrl = new URL(key.url);
        if (isDashboardPath(keyUrl.pathname) && isNavigationRequest(key)) {
            const match = await cache.match(key, CACHE_MATCH_OPTIONS);
            if (match) return match;
        }
    }

    return null;
}

async function serveOfflineNavigation(request, cache, returnTo) {
    if (returnTo && isDashboardPath(new URL(returnTo, self.location.origin).pathname)) {
        const dashboardFallback = await findDashboardFallback(cache, request);
        if (dashboardFallback) return dashboardFallback;
    }

    const offlinePage = await cache.match(OFFLINE_URL, CACHE_MATCH_OPTIONS);
    if (offlinePage) {
        if (returnTo) {
            return offlineRedirect(returnTo);
        }
        return offlinePage;
    }

    return offlineResponse();
}

async function cacheFirst(request, cache) {
    const url = new URL(request.url);
    const cached = isDashboardPath(url.pathname)
        ? await findDashboardFallback(cache, request)
        : await cache.match(request, CACHE_MATCH_OPTIONS);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        await putInCache(cache, request, response);
        return response;
    } catch {
        if (!isNavigationRequest(request)) {
            return offlineResponse();
        }

        return serveOfflineNavigation(request, cache, url.pathname);
    }
}

async function networkFirst(request, cache) {
    try {
        const response = await fetch(request);
        await putInCache(cache, request, response);
        return response;
    } catch {
        if (!isNavigationRequest(request)) {
            const cached = await cache.match(request, CACHE_MATCH_OPTIONS);
            return cached || offlineResponse();
        }

        const url = new URL(request.url);
        return serveOfflineNavigation(request, cache, null);
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            if (isNextStaticAsset(url.pathname)) {
                return networkFirst(request, cache);
            }
            if (shouldUseCacheFirst(url.pathname)) {
                return cacheFirst(request, cache);
            }
            return networkFirst(request, cache);
        })
    );
});
