/**
 * Service Worker: Bel Sekolah SD
 * Versi Cache Inti: bel-sekolah-v1
 * Versi Cache Audio: bel-sekolah-audio-v1
 * Arsitektur: Offline-First dengan Cache API, Dedicated Audio Cache, & Background Revalidation
 */

const CACHE_NAME = 'bel-sekolah-v1';
const AUDIO_CACHE_NAME = 'bel-sekolah-audio-v1';

// Aset Inti Aplikasi (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
];

// Seluruh Daftar File Audio Utama (Nada Bel & Pengumuman Suara Wanita Indonesia)
const AUDIO_FILES = [
  '/audio/bel.mp3',
  '/audio/bel.wav',
  '/audio/suara-wanita/masuk.mp3',
  '/audio/suara-wanita/pergantian-jam.mp3',
  '/audio/suara-wanita/istirahat.mp3',
  '/audio/suara-wanita/selesai-istirahat.mp3',
  '/audio/suara-wanita/pulang.mp3',
  '/audio/suara-wanita/upacara.mp3',
  '/audio/suara-wanita/kegiatan-khusus.mp3',
  '/audio/suara-wanita/contoh-suara.mp3',
];

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Precache Core Assets
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[ServiceWorker] Gagal precache aset inti: ${url}`, err);
            })
          )
        );
      }),
      // Precache Dedicated Audio Cache
      caches.open(AUDIO_CACHE_NAME).then((audioCache) => {
        return Promise.allSettled(
          AUDIO_FILES.map((url) =>
            audioCache.add(url).catch((err) => {
              // Jika file suara wanita belum diletakkan di folder public, tidak apa-apa (tidak menggagalkan instalasi SW)
              console.log(`[ServiceWorker] Audio belum tersedia di server: ${url}`);
            })
          )
        );
      }),
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATE EVENT (Pembersihan Versi Cache Lama, Pertahankan Audio Cache)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // Jangan hapus CACHE_NAME aktif dan AUDIO_CACHE_NAME
          if (name !== CACHE_NAME && name !== AUDIO_CACHE_NAME) {
            console.log(`[ServiceWorker] Menghapus cache versi lama: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH EVENT (Strategi Offline-First & Cache-First Khusus Audio)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // A. STRATEGI FILE AUDIO LOKAL (/audio/): Cache-First Murni dengan bel-sekolah-audio-v1
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (audioCache) => {
        // 1. Cek di Cache Storage Audio terlebih dahulu
        const cachedResponse = await audioCache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Jika belum ada di cache, coba unduh dari server (saat online)
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            // Simpan ke cache audio agar panggilan berikutnya dan offline instan
            audioCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          // 3. Jika offline dan file tidak ada di cache:
          if (url.pathname.includes('bel.mp3')) {
            const fallbackWav = await audioCache.match('/audio/bel.wav');
            if (fallbackWav) return fallbackWav;
          }
          // Kembalikan 404 response terisolasi tanpa merusak aplikasi
          return new Response('Audio offline tidak ditemukan di cache.', {
            status: 404,
            statusText: 'Not Found in Audio Cache',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })
    );
    return;
  }

  // B. STRATEGI NAVIGASI HALAMAN (HTML): Network-First dengan Fallback ke Cache
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
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
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
        .catch(() => cached);

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
    event.ports[0]?.postMessage({
      version: CACHE_NAME,
      audioVersion: AUDIO_CACHE_NAME,
    });
  }
});
