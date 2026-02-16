// ============================================================================
// EJLOG WMS - Service Worker Registration
// Utility per registrare e gestire service worker PWA
// ============================================================================

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config?: Config): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      if (isLocalhost) {
        // Localhost: check if service worker exists
        checkValidServiceWorker(swUrl, config);

        navigator.serviceWorker.ready.then(() => {
          console.log(
            '[PWA] This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        // Production: register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[PWA] Service Worker registered:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker available, need refresh
              console.log('[PWA] New content is available; please refresh.');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content cached for offline use
              console.log('[PWA] Content is cached for offline use.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[PWA] Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config): void {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');

      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service worker not found or wrong content type
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found, proceed with registration
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[PWA] No internet connection found. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[PWA] Service Worker unregistered');
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

/**
 * Trigger service worker update check manually
 */
export function checkForUpdates(): Promise<void> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready.then((registration) => {
      return registration.update();
    });
  }
  return Promise.resolve();
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaitingAndReload(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

/**
 * Clear all service worker caches
 */
export async function clearCaches(): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith('ejlog-wms-')) {
          return caches.delete(cacheName);
        }
      })
    );
  }
}

/**
 * Precache specific URLs
 */
export function precacheUrls(urls: string[]): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      payload: { urls },
    });
  }
}

/**
 * Monitor online/offline status
 */
export function monitorOnlineStatus(config?: Config): void {
  const handleOnline = () => {
    console.log('[PWA] Back online');
    if (config?.onOnline) {
      config.onOnline();
    }
  };

  const handleOffline = () => {
    console.log('[PWA] Went offline');
    if (config?.onOffline) {
      config.onOffline();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check current status
  if (!navigator.onLine && config?.onOffline) {
    config.onOffline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get service worker registration status
 */
export async function getRegistrationStatus(): Promise<{
  registered: boolean;
  waiting: boolean;
  active: boolean;
}> {
  if (!('serviceWorker' in navigator)) {
    return { registered: false, waiting: false, active: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return { registered: false, waiting: false, active: false };
  }

  return {
    registered: true,
    waiting: registration.waiting !== null,
    active: registration.active !== null,
  };
}

/**
 * Request persistent storage (for offline data)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[PWA] Persisted storage granted: ${isPersisted}`);
    return isPersisted;
  }
  return false;
}

/**
 * Check storage quota
 */
export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    console.log(`[PWA] Storage: ${usage} / ${quota} bytes (${percentUsed.toFixed(2)}%)`);

    return { usage, quota, percentUsed };
  }

  return { usage: 0, quota: 0, percentUsed: 0 };
}

export default {
  register,
  unregister,
  checkForUpdates,
  skipWaitingAndReload,
  clearCaches,
  precacheUrls,
  monitorOnlineStatus,
  getRegistrationStatus,
  requestPersistentStorage,
  checkStorageQuota,
};
