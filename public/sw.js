const CACHE = 'coffee-empire-scene-v1';
const CORE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('coffee-empire-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('authorization') || url.pathname.startsWith('/api/') || url.pathname.includes('__server')) return;
  const asset = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/__l5e/assets-v1/') || CORE.includes(url.pathname);
  if (request.mode !== 'navigate' && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode !== 'navigate') { const cached = await cache.match(request); if (cached) return cached; }
    try { const response = await fetch(request); if (response.ok && response.type === 'basic') await cache.put(request, response.clone()); return response; }
    catch { const fallback = await cache.match(request) || (request.mode === 'navigate' ? await cache.match('/') : undefined); return fallback || new Response('Offline – dieser Inhalt wurde noch nicht geladen.', { status: 503 }); }
  })());
});