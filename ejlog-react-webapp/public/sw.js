/**
 * Service Worker for EjLog WMS PWA
 * Feature D - Progressive Web App Implementation
 */

const CACHE_VERSION = 'ejlog-v1.0.0';
const CACHE_NAME = `ejlog-wms-${CACHE_VERSION}`;

// Assets da cachare immediatamente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// API endpoints da cachare con network-first strategy
const API_CACHE_NAME = `${CACHE_NAME}-api`;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Forza attivazione immediata
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker version:', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Elimina cache vecchie
              return name.startsWith('ejlog-wms-') && name !== CACHE_NAME && name !== API_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned');
        return self.clients.claim(); // Prendi controllo immediato
      })
  );
});

// Fetch event - caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora chrome-extension e altri protocolli
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network First per API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }

  // Cache First per static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Stale While Revalidate per il resto
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

/**
 * Network First Strategy
 * Prova network, fallback a cache se offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache solo risposte ok
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback offline page
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - dati non disponibili in cache',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache First Strategy
 * Cerca in cache, fallback a network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache and network both failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy
 * Ritorna cache immediatamente, aggiorna in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, ma abbiamo già cache
      return cachedResponse;
    });

  // Ritorna cache se disponibile, altrimenti aspetta network
  return cachedResponse || fetchPromise;
}

// Background Sync per operazioni offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-scans') {
    event.waitUntil(syncOfflineScans());
  }
});

/**
 * Sincronizza scansioni offline quando torna connessione
 */
async function syncOfflineScans() {
  console.log('[SW] Syncing offline scans...');
  // TODO: Implementare logica sync con IndexedDB
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {
    title: 'EjLog WMS',
    body: 'Nuova notifica',
    icon: '/icon-192x192.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

console.log('[SW] Service Worker loaded successfully');
