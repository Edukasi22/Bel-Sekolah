/**
 * Service Worker: Bel Sekolah SD
 * Versi Cache: bel-sekolah-v1
 * Arsitektur: Offline-First dengan Cache API & Background Revalidation
 */

const CACHE_NAME = 'bel-sekolah-v1';

// Aset Inti (Core Assets) yang langsung dicache saat Service Worker diinstal
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/audio/bel.mp3',
  '/audio/bel.wav',
];

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Menggunakan map individual agar kegagalan 1 aset opsional tidak menggagalkan seluruh install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[ServiceWorker] Gagal precache aset: ${url}`, err);
          })
        )
      );
    }).then(() => {
      // Aktifkan langsung tanpa menunggu reload
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATE EVENT (Pembersihan Versi Cache Lama)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[ServiceWorker] Menghapus cache versi lama: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Ambil alih seluruh klien yang sedang terbuka
      return self.clients.claim();
    })
  );
});

// 3. FETCH EVENT (Strategi Offline-First & Cache-First)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya proses request HTTP/HTTPS dengan method GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jangan cache skema chrome-extension atau request cross-origin yang tidak aman
  if (!url.protocol.startsWith('http')) return;

  // A. STRATEGI NAVIGASI HALAMAN (HTML): Network-First dengan Fallback ke Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Ketika offline, kembalikan halaman utama dari cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // B. STRATEGI FILE AUDIO LOKAL (/audio/): Cache-First
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika network offline dan audio belum ada di cache, coba cari bel.wav / bel.mp3
            return caches.match('/audio/bel.wav').then((res) => res || caches.match('/audio/bel.mp3'));
          });
      })
    );
    return;
  }

  // C. STRATEGI ASET STATIS (JS, CSS, Gambar, Ikon): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Ketika offline dan tidak ada di cache, kembalikan cached jika ada
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});

// 4. MESSAGE EVENT
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
});
