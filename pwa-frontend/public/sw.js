const CACHE_NAME = 'app-de-custos-v5';

const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/style.css',
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force new SW to take over immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim(); // Immediately control the page
});

self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    // SECURITY: Never cache API calls to Supabase (auth tokens, user data)
    if (requestUrl.includes('supabase.co') || requestUrl.includes('supabase.in')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For development, use Network-First strategy
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Ignore caching for extension/chrome requests
                if (!requestUrl.startsWith('http')) return response;

                // Cache the new version
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Fallback to cache if offline
                return caches.match(event.request);
            })
    );
});
