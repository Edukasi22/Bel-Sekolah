# BEL SEKOLAH SD - SISTEM BEL SEKOLAH OTOMATIS BERBASIS WEB & PROGRESSIVE WEB APP (PWA)

Aplikasi **BEL SEKOLAH SD** adalah sistem bel sekolah otomatis berbasis web dan Progressive Web App (PWA) yang dirancang khusus untuk Sekolah Dasar (SD) di Indonesia. Aplikasi ini mendukung operasional **ONLINE dan OFFLINE** penuh tanpa bergantung pada server internet luar, dilengkapi dengan sintesis nada bel Web Audio API, pembacaan pengumuman suara Bahasa Indonesia (SpeechSynthesis API), jam digital 24 jam real-time, database **IndexedDB** untuk jadwal, **LocalStorage** untuk pengaturan sekolah, **Service Worker & Cache API** versi `bel-sekolah-v1`, serta halaman pantauan **"STATUS SISTEM"**.

---

## 1. STRUKTUR FILE LENGKAP PWA

```text
/
├── index.html                   # Entry point HTML dengan link manifest.json & meta tag PWA
├── metadata.json                # Metadata AI Studio untuk aplikasi
├── package.json                 # Konfigurasi dependensi npm
├── tsconfig.json                # Konfigurasi compiler TypeScript & tipe PWA
├── vite.config.ts               # Bundler Vite dengan integrasi PWA
├── README.md                    # Dokumentasi lengkap & panduan deployment HTTPS
├── public/
│   ├── manifest.json            # Web App Manifest PWA (standar Chrome/Edge/Android)
│   ├── service-worker.js        # Service Worker (Cache API, versi bel-sekolah-v1)
│   ├── icon.svg                 # Ikon vektor aplikasi
│   ├── pwa-192x192.png          # Ikon PWA standar 192px
│   ├── pwa-512x512.png          # Ikon PWA standar 512px
│   ├── apple-touch-icon.png     # Ikon iOS Safari 180px
│   ├── favicon.png              # Favicon tab browser
│   └── audio/
│       ├── bel.mp3              # File audio bel sekolah lokal
│       └── bel.wav              # File audio bel cadangan
├── scripts/
│   └── generate-assets.js       # Script generator ikon dan audio bawaan
└── src/
    ├── main.tsx                 # Titik masuk React & inisialisasi Service Worker
    ├── App.tsx                  # Komponen utama, router tab & PWA update notifier
    ├── index.css                # Styling Tailwind CSS
    ├── types/
    │   └── index.ts             # Definisi tipe data TypeScript (Jadwal, Pengaturan, Log)
    ├── services/
    │   ├── indexedDb.ts         # Penyimpanan database IndexedDB (Jadwal & Riwayat)
    │   ├── storage.ts           # Manajemen penyimpanan lokal (LocalStorage & Data Contoh)
    │   ├── swRegister.ts        # Pendaftaran & pengecekan status Service Worker & Cache
    │   ├── soundEngine.ts       # Mesin audio: Web Audio Synth, File Playback, & Web Speech API
    │   └── scheduler.ts         # Mesin penjadwalan waktu, proteksi trigger ganda, & sleep detector
    ├── hooks/
    │   ├── usePWAInstall.ts     # Hook instalasi PWA di Chrome/Edge/iOS
    │   └── useOnlineStatus.ts   # Hook pemantau status koneksi online/offline
    └── components/
        ├── Header.tsx           # Header aplikasi, status online/offline, tombol PWA & fullscreen
        ├── Sidebar.tsx          # Navigasi tab menu sekolah (termasuk menu Status Sistem)
        ├── DashboardView.tsx    # Dashboard: jam digital, countdown, jadwal hari ini
        ├── SystemStatusView.tsx # Halaman "STATUS SISTEM" (7 komponen status utama)
        ├── ScheduleView.tsx     # Pengatur jadwal mingguan (Senin-Minggu, filter, template)
        ├── SpecialScheduleView.tsx # Jadwal tanggal khusus (Ujian, upacara, acara)
        ├── HolidayView.tsx      # Manajemen tanggal hari libur sekolah
        ├── ManualBellModal.tsx  # Kontrol tombol bel manual seketika dengan preset
        ├── SoundSettingsView.tsx# Pengaturan volume nada bel, intonasi suara, & voice ID
        ├── SchoolSettingsView.tsx # Pengaturan nama sekolah, logo, operator, & zona waktu
        ├── HistoryView.tsx      # Log riwayat bel berbunyi & ekspor CSV
        ├── DiagnosticsView.tsx  # Panel diagnostik sistem & simulasi pengujian
        ├── ScreenDisplayMode.tsx# Mode tampilan proyektor/TV lorong sekolah (Layar Bel)
        ├── BackupRestoreView.tsx# Cadangan data JSON/CSV dan tombol reset 2 tahap
        ├── FirstRunModal.tsx    # Dialog pilihan data contoh saat pertama dijalankan
        └── Toast.tsx            # Sistem notifikasi toast ringan
```

---

## 2. ARSITEKTUR ONLINE & OFFLINE (PWA)

### A. Manifest (`/public/manifest.json`)
Mendukung instalasi di Android, Windows, Mac, Linux, dan iOS dengan mode tampilan `standalone`, ikon resolusi 192x192 dan 512x512, tema warna biru `#1E40AF`, dan orientasi responsif.

### B. Service Worker & Cache API (`/public/service-worker.js`)
- **Versi Cache**: `bel-sekolah-v1`.
- **Precache Otomatis**: Menyimpan seluruh berkas inti (`/`, `/index.html`, `/manifest.json`, ikon, `/audio/bel.mp3`, `/audio/bel.wav`) saat pertama kali dipasang.
- **Pembersihan Cache Lama**: Saat versi cache berubah (misal ke `bel-sekolah-v2`), event `activate` secara otomatis menghapus seluruh cache versi lama agar tidak membebani memori browser.
- **Strategi Caching**:
  - Halaman Navigasi (`HTML`): *Network-First* dengan fallback ke Cache offline.
  - File Audio (`/audio/`): *Cache-First* untuk respon instan tanpa jeda buffering.
  - Skrip & Styling (`JS, CSS, Gambar`): *Stale-While-Revalidate*.

### C. Pembagian Penyimpanan Data (IndexedDB & LocalStorage)
- **IndexedDB (`BelSekolahSD_Database`)**:
  - Menyimpan data berbobot tinggi: Seluruh **Jadwal Mingguan**, **Jadwal Khusus**, **Daftar Hari Libur**, dan **Catatan Riwayat Bel**.
  - Sifatnya permanen dan tidak terpengaruh saat koneksi internet terputus.
- **LocalStorage**:
  - Menyimpan konfigurasi profil sederhana: Nama Sekolah, Nama Operator, Nomor Telepon, Pilihan Zona Waktu (WITA/WIB/WIT), dan Volume.

---

## 3. HALAMAN "STATUS SISTEM"

Aplikasi menyediakan halaman khusus **STATUS SISTEM** yang memantau 7 sub-sistem utama secara real-time:

1. **Internet**: `🟢 ONLINE` atau `🔴 OFFLINE` (Memantau status koneksi perangkat).
2. **Service Worker**: `🟢 AKTIF` atau `🔴 TIDAK AKTIF` (Memverifikasi apakah service worker sedang mencegat request).
3. **Cache**: `🟢 AKTIF` atau `🔴 TIDAK AKTIF` (Menampilkan versi cache yang sedang digunakan, misal `bel-sekolah-v1`).
4. **IndexedDB**: `🟢 AKTIF` atau `🔴 TIDAK AKTIF` (Memverifikasi database lokal jadwal siap digunakan).
5. **Audio**: `🟢 BERHASIL` atau `🔴 GAGAL` (Memverifikasi izin autoplay audio pada browser).
6. **PWA**: `🟢 TERPASANG` atau `⚪ BELUM TERPASANG` (Memeriksa apakah berjalan dalam mode *standalone window*).
7. **Sistem Bel**: `🟢 AKTIF` atau `🟡 TIDAK AKTIF` (Menandakan bel otomatis siap dieksekusi).

Setiap kartu pada halaman Status Sistem dilengkapi dengan tombol tes interaktif: *Uji Bunyi Audio*, *Cek Database*, dan *Cek Cache API*.

---

## 4. PANDUAN PENGGUNAAN APLIKASI TANPA INTERNET (OFFLINE)

Aplikasi telah memenuhi syarat **100% Offline-First**:

1. **Inisialisasi Pertama Kali**:
   - Buka aplikasi minimal 1 kali saat ada koneksi internet agar Service Worker dapat mengunduh seluruh file aplikasi dan audio bel ke Cache Storage.
   - Klik tombol **`[ AKTIFKAN BEL SEKARANG ]`** untuk memberikan izin audio browser.
2. **Menjalankan Tanpa Internet**:
   - Putuskan koneksi internet (Wi-Fi dimatikan atau kabel LAN dicabut).
   - Indikator pada header otomatis menampilkan badge merah `🔴 OFFLINE`.
   - Jam digital tetap berdetik akurat sesuai jam internal laptop.
   - Bel tetap berbunyi tepat pada jam yang dijadwalkan.
   - Seluruh jadwal dari IndexedDB tetap utuh dan dapat diedit atau ditambah tanpa internet.
3. **Membuka Kembali Aplikasi Offline**:
   - Anda dapat menutup browser, mematikan laptop, dan membukanya kembali tanpa internet. Halaman akan terbuka seketika dari cache lokal.

---

## 5. PANDUAN DEPLOYMENT APLIKASI KE HOSTING HTTPS

Service Worker dan fitur PWA **wajib** dijalankan melalui protokol aman **HTTPS** (atau `localhost` saat pengembangan). Berikut cara deploy ke berbagai layanan hosting gratis dan terpercaya:

### Opsi 1: Vercel (Rekomendasi Cepat)
1. Buat build aplikasi:
   ```bash
   npm run build
   ```
   Folder `dist/` akan terbentuk.
2. Pasang CLI Vercel: `npm i -g vercel`.
3. Jalankan `vercel` di terminal direktori proyek dan pilih opsi default.
4. Vercel otomatis memberikan domain ber-HTTPS aktif (contoh: `https://bel-sekolah-sd.vercel.app`).

### Opsi 2: Netlify
1. Jalankan:
   ```bash
   npm run build
   ```
2. Buka [app.netlify.com](https://app.netlify.com/).
3. Tarik (*drag-and-drop*) folder `dist/` ke area upload Netlify.
4. Netlify otomatis mengaktifkan sertifikat SSL/HTTPS gratis.

### Opsi 3: Firebase Hosting
1. Pasang CLI Firebase: `npm i -g firebase-tools`.
2. Jalankan `firebase login` lalu `firebase init hosting`.
   - Pilih public directory: `dist`.
   - Configure as single-page app: `Yes`.
3. Jalankan:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Opsi 4: VPS Sendiri (NGINX + Let's Encrypt SSL)
1. Salin isi folder `dist/` ke `/var/www/bel-sekolah-sd/`.
2. Contoh konfigurasi NGINX:
   ```nginx
   server {
       listen 80;
       server_name bel.sekolah.sch.id;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name bel.sekolah.sch.id;

       ssl_certificate /etc/letsencrypt/live/bel.sekolah.sch.id/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/bel.sekolah.sch.id/privkey.pem;

       root /var/www/bel-sekolah-sd;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Header Cache PWA Service Worker
       location = /service-worker.js {
           expires 0;
           add_header Cache-Control "no-cache, no-store, must-revalidate";
       }
   }
   ```

---

## 6. SISTEM UPDATE APLIKASI YANG AMAN

- Ketika Anda merilis pembaruan baru (misalnya mengubah versi cache di `service-worker.js` menjadi `bel-sekolah-v2`):
  1. Service Worker baru akan diunduh secara hening di latar belakang.
  2. Banner otomatis muncul di aplikasi:
     `Pembaruan Aplikasi Tersedia! Versi baru telah tersimpan di cache. [ Muat Ulang Sekarang ]`
  3. Pengguna cukup menekan tombol tersebut, dan aplikasi langsung berpindah ke versi baru tanpa kehilangan jadwal yang tersimpan di IndexedDB.
