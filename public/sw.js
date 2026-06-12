const CACHE = 'planner-v3';
const API_CACHE = 'planner-api-v1';
const STATIC_CACHE = 'planner-static-v1';

const STATIC_ASSETS = [
  '/',
  '/today',
  '/next-7-days',
  '/upcoming',
  '/all',
  '/calendar',
  '/offline',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(STATIC_CACHE),
      caches.open(API_CACHE),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== API_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) return;

  // Navigation requests — use stale-while-revalidate pattern
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          return offline || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets (_next/static, fonts, images) — cache-first with background refresh
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.match(/\.(js|css|woff2?|svg|png|ico|webp|avif)$/)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || (await fetchPromise);
      })()
    );
    return;
  }

  // API routes — cache-first for GET with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);

        const networkPromise = fetch(request).then((res) => {
          if (res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        }).catch(() => cached);

        if (cached) {
          // Return cached immediately, but update in background
          networkPromise.catch(() => {});
          return cached;
        }

        return networkPromise;
      })()
    );
    return;
  }

  // Default — network-first
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503 });
      }
    })()
  );
});
