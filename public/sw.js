// TripFldr Service Worker - Offline-First PWA
const CACHE_VERSION = 'tripfldr-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/trips',
  '/trips/new',
  '/settings',
  '/calendar',
  '/search',
  '/manifest.json',
  '/logos/icon-192.png',
  '/logos/icon-512.png',
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/sync/',
  '/api/auth/',
  '/api/places/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('tripfldr-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (let them pass through)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API routes - Network first, fall back to offline response
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // External requests (weather, maps) - Network first, cache response
  if (url.origin !== location.origin) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // App shell and pages - Cache first, update in background
  event.respondWith(cacheFirstWithNetworkUpdate(request));
});

// Strategy: Cache first, then update cache from network
async function cacheFirstWithNetworkUpdate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise || new Response('Offline', { status: 503 });
}

// Strategy: Network first, cache as fallback
async function networkFirstWithCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Strategy: Network first, return offline indicator for API
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Return a JSON response indicating offline status
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle background sync for queued mutations
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'sync-mutations') {
    event.waitUntil(processMutationQueue());
  }
});

// Process queued mutations when back online
async function processMutationQueue() {
  console.log('[SW] Processing mutation queue...');
  // The actual sync is handled by the client-side code
  // This just triggers the sync when we come back online
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_NOW' });
  });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => 
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Periodic sync triggered');
    event.waitUntil(processMutationQueue());
  }
});

console.log('[SW] Service worker loaded');
