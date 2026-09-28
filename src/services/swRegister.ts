export interface SWStatus {
  isSupported: boolean;
  isActive: boolean;
  cacheName: string;
  cacheCount: number;
}

export async function registerServiceWorker(
  onUpdateAvailable?: () => void
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker tidak didukung pada browser ini.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[SW] Service Worker terdaftar dengan scope:', registration.scope);

    // Cek apakah ada update
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Versi baru aplikasi ditemukan dan siap digunakan.');
            if (onUpdateAvailable) {
              onUpdateAvailable();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.warn('[SW] Pendaftaran Service Worker gagal:', error);
    return null;
  }
}

export async function checkSWStatus(): Promise<SWStatus> {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;

  if (!isSupported) {
    return {
      isSupported: false,
      isActive: false,
      cacheName: '-',
      cacheCount: 0,
    };
  }

  let isActive = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    isActive = !!(reg && (reg.active || reg.installing || reg.waiting));
  } catch {
    isActive = false;
  }

  let cacheName = 'bel-sekolah-v1';
  let cacheCount = 0;
  try {
    const keys = await caches.keys();
    cacheCount = keys.length;
    if (keys.length > 0) {
      cacheName = keys[0];
    }
  } catch {
    // ignore
  }

  return {
    isSupported: true,
    isActive,
    cacheName,
    cacheCount,
  };
}

export async function checkCacheAPI(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const testKey = 'test-cache-probe';
    const cache = await caches.open(testKey);
    await caches.delete(testKey);
    return true;
  } catch {
    return false;
  }
}
