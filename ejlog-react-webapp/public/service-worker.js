// ============================================================================
// EJLOG WMS - Service Worker
// PWA offline-first caching strategy
// ============================================================================

const CACHE_VERSION = 'ejlog-wms-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Files da cacheare immediatamente all'installazione
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Aggiungi altri asset statici critici qui
];

// Pattern URL da cacheare
const CACHE_PATTERNS = {
  // Asset statici (immagini, font, etc.)
  static: /\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/,
  // JavaScript e CSS chunks
  chunks: /\.(js|css)$/,
  // API calls
  api: /^https?:\/\/localhost:(3077|3079|8080)\/api\/.*/,
};

// ============================================================================
// INSTALL EVENT
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force activation immediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Precache failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Rimuovi vecchie cache
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('ejlog-wms-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Prendi controllo immediato di tutte le pagine
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT - Caching Strategy
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora chrome-extension e altre scheme
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // ========================================================================
  // STRATEGY 1: Network First per API calls
  // ========================================================================
  if (CACHE_PATTERNS.api.test(request.url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // ========================================================================
  // STRATEGY 2: Cache First per asset statici
  // ========================================================================
  if (CACHE_PATTERNS.static.test(request.url) || CACHE_PATTERNS.chunks.test(request.url)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // ========================================================================
  // STRATEGY 3: Network First con fallback per HTML
  // ========================================================================
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // ========================================================================
  // DEFAULT: Network with cache fallback
  // ========================================================================
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network First Strategy
 * Prova prima la rete, se fallisce usa cache
 * Ideale per API calls che devono essere fresh
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // No cache available
    throw error;
  }
}

/**
 * Cache First Strategy
 * Prova prima la cache, se manca va in rete
 * Ideale per asset statici che non cambiano
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

/**
 * Network First with Fallback
 * Per navigazione HTML con fallback offline page
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page fallback
    const offlinePage = await caches.match('/index.html');
    if (offlinePage) {
      return offlinePage;
    }

    throw error;
  }
}

// ============================================================================
// MESSAGE EVENT - Per comunicazione con app
// ============================================================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('ejlog-wms-')) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
      break;

    case 'CACHE_URLS':
      if (payload && Array.isArray(payload.urls)) {
        event.waitUntil(
          caches.open(RUNTIME_CACHE).then((cache) => {
            return cache.addAll(payload.urls);
          })
        );
      }
      break;

    default:
      console.warn('[Service Worker] Unknown message type:', type);
  }
});

// ============================================================================
// BACKGROUND SYNC (per future features)
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implementare logica di sincronizzazione dati offline
  console.log('[Service Worker] Syncing offline data...');
  // TODO: Sync pending operations from IndexedDB to server
}

// ============================================================================
// PUSH NOTIFICATIONS (per future features)
// ============================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'EjLog WMS';
  const options = {
    body: data.body || 'Hai una nuova notifica',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, focus su quella
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }

      // Altrimenti apri nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});

console.log('[Service Worker] Registered successfully:', CACHE_VERSION);

