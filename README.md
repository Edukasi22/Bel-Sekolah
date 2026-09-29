# BEL SEKOLAH SD - SISTEM BEL SEKOLAH OTOMATIS BERBASIS WEB & PROGRESSIVE WEB APP (PWA)

Aplikasi **BEL SEKOLAH SD** adalah sistem bel sekolah otomatis berbasis web dan Progressive Web App (PWA) yang dirancang khusus untuk Sekolah Dasar (SD) di Indonesia. Aplikasi ini mendukung operasional **ONLINE dan OFFLINE** penuh tanpa bergantung pada server internet luar maupun voice sistem operasi.

Sistem suara pengumuman telah ditingkatkan menggunakan **Audio MP3 Lokal Suara Wanita Bahasa Indonesia (Prioritas 1)** yang dicache melalui **Cache API (bel-sekolah-audio-v1)** dan didukung oleh penyimpanan rekaman lokal **IndexedDB**. Text-to-Speech (TTS) tetap tersedia sebagai fitur sekunder atau opsi cadangan.

---

## 1. STRUKTUR FILE LENGKAP PWA

```text
/
├── index.html                   # Entry point HTML dengan link manifest.json & meta tag PWA
├── metadata.json                # Metadata AI Studio untuk aplikasi
├── package.json                 # Konfigurasi dependensi npm
├── tsconfig.json                # Konfigurasi compiler TypeScript & tipe PWA
├── vite.config.ts               # Bundler Vite dengan integrasi PWA & safe WebSocket guard
├── README.md                    # Dokumentasi lengkap & panduan teknis
├── public/
│   ├── manifest.json            # Web App Manifest PWA (standar Chrome/Edge/Android)
│   ├── service-worker.js        # Service Worker (bel-sekolah-v1 & bel-sekolah-audio-v1)
│   ├── icon.svg                 # Ikon vektor aplikasi
│   ├── pwa-192x192.png          # Ikon PWA standar 192px
│   ├── pwa-512x512.png          # Ikon PWA standar 512px
│   ├── apple-touch-icon.png     # Ikon iOS Safari 180px
│   ├── favicon.png              # Favicon tab browser
│   └── audio/
│       ├── bel.mp3              # File audio bel sekolah lokal utama
│       ├── bel.wav              # File audio bel cadangan
│       └── suara-wanita/        # Folder khusus pengumuman suara wanita Indonesia
│           ├── PETUNJUK_AUDIO.txt # Panduan penamaan file rekaman suara
│           ├── masuk.mp3
│           ├── pergantian-jam.mp3
│           ├── istirahat.mp3
│           ├── selesai-istirahat.mp3
│           ├── pulang.mp3
│           ├── upacara.mp3
│           ├── kegiatan-khusus.mp3
│           └── contoh-suara.mp3
├── scripts/
│   └── generate-assets.js       # Generator aset ikon dan audio nada bel sekolah
└── src/
    ├── main.tsx                 # Titik masuk React & inisialisasi Service Worker
    ├── App.tsx                  # Komponen utama, audio readiness handler, & modal warning
    ├── index.css                # Styling Tailwind CSS
    ├── types/
    │   └── index.ts             # Definisi tipe TypeScript (AudioReadinessState, CustomAudioRecord)
    ├── services/
    │   ├── indexedDb.ts         # IndexedDB: Jadwal, Riwayat, & Penyimpanan Audio Kustom
    │   ├── storage.ts           # Manajemen penyimpanan profil sekolah (LocalStorage)
    │   ├── swRegister.ts        # Pendaftaran & verifikasi Service Worker & Cache API
    │   ├── soundEngine.ts       # Audio Engine: Prioritas Suara, Playback Lock, & Asset Validator
    │   └── scheduler.ts         # Penjadwal otomatis, proteksi trigger ganda, & sleep detector
    ├── hooks/
    │   ├── usePWAInstall.ts     # Hook instalasi PWA di Chrome/Edge/iOS
    │   └── useOnlineStatus.ts   # Hook pemantau status koneksi online/offline
    └── components/
        ├── Header.tsx           # Status online/offline & badge 🟢 SUARA BEL SIAP
        ├── Sidebar.tsx          # Navigasi tab menu sekolah
        ├── DashboardView.tsx    # Dashboard jam digital, countdown, & status suara sekolah
        ├── SystemStatusView.tsx # Status Sistem, DIAGNOSTIK AUDIO OFFLINE, & UJI MODE OFFLINE
        ├── SoundSettingsView.tsx# Manajemen Aset Audio Offline, Upload Suara, & Ekspor/Impor
        ├── ScheduleView.tsx     # Pengatur jadwal mingguan (Senin-Minggu, filter, template)
        ├── SpecialScheduleView.tsx # Jadwal tanggal khusus (Ujian, upacara, acara)
        ├── HolidayView.tsx      # Manajemen tanggal hari libur sekolah
        ├── ManualBellModal.tsx  # Kontrol tombol bel manual seketika dengan preset
        ├── SchoolSettingsView.tsx # Pengaturan nama sekolah, logo, operator, & zona waktu
        ├── HistoryView.tsx      # Log riwayat bel berbunyi & ekspor CSV
        ├── DiagnosticsView.tsx  # Panel diagnostik sistem & simulasi pengujian
        ├── ScreenDisplayMode.tsx# Mode tampilan proyektor/TV lorong sekolah (Layar Bel)
        ├── BackupRestoreView.tsx# Cadangan data JSON/CSV dan tombol reset 2 tahap
        ├── FirstRunModal.tsx    # Dialog pilihan data contoh saat pertama dijalankan
        └── Toast.tsx            # Sistem notifikasi toast ringan
```

---

## 2. PRIORITAS SISTEM SUARA (OFFLINE FIRST)

1. **PRIORITAS 1 (Utama)**:
   - Rekaman Audio Kustom pengguna di **IndexedDB**.
   - Berkas Audio MP3 lokal di folder `public/audio/suara-wanita/` yang dicache oleh Service Worker ke dalam **`bel-sekolah-audio-v1`**.
   - Menggunakan format suara wanita Bahasa Indonesia yang ramah, sopan, artikulasi jelas, dan disesuaikan untuk siswa Sekolah Dasar.
2. **PRIORITAS 2 (Fitur Tambahan)**:
   - Text-to-Speech (TTS) Bahasa Indonesia melalui SpeechSynthesis API browser, **hanya aktif jika dipilih secara eksplisit oleh operator** di Pengaturan Suara.
3. **PROTEKSI & KEAMANAN**:
   - Jika berkas audio belum tersedia, sistem memunculkan dialog pemberitahuan dan membunyikan nada bel saja agar kegiatan sekolah tidak terlewat. Aplikasi tidak akan crash atau memaksakan suara robot asing.

---

## 3. PANDUAN PENGISIAN & PENGGANTIAN SUARA WANITA

### Cara 1: Melalui Antarmuka Aplikasi (Disimpan Otomatis ke IndexedDB)
1. Buka menu **Pengaturan Suara**.
2. Pada bagian **Daftar Aset Suara Wanita Bahasa Indonesia (Offline)**, cari kategori pengumuman yang diinginkan (contoh: *Bel Masuk Sekolah*).
3. Klik tombol **[ Unggah Suara ]** lalu pilih berkas audio dari komputer (format `.mp3`, `.wav`, atau `.m4a`).
4. Berkas otomatis tersimpan di IndexedDB secara permanen dan langsung aktif sebagai sumber suara utama, bahkan saat internet mati.

### Cara 2: Memasukkan File Langsung ke Folder Proyek
1. Siapkan file rekaman suara wanita berformat `.mp3` (disarankan 44.1 kHz, 128 kbps).
2. Salin file ke dalam direktori:
   `public/audio/suara-wanita/`
3. Beri nama sesuai daftar wajib:
   - `masuk.mp3`
   - `pergantian-jam.mp3`
   - `istirahat.mp3`
   - `selesai-istirahat.mp3`
   - `pulang.mp3`
   - `upacara.mp3`
   - `kegiatan-khusus.mp3`
   - `contoh-suara.mp3`

---

## 4. CARA MEMASTIKAN AUDIO TERCACHE & UJI OFFLINE

1. **Memastikan Audio Tercache**:
   - Buka menu **Status Sistem**.
   - Periksa bagian **DIAGNOSTIK AUDIO OFFLINE**.
   - Setiap aset audio yang telah tersimpan di cache atau IndexedDB akan bertanda hijau: `✓ Tersedia` atau `✓ Kustom`.
   - Kartu `bel-sekolah-audio-v1` menunjukkan status `✓ Tersedia`.
2. **Menjalankan Uji Coba Mode Offline**:
   - Di halaman **Status Sistem**, klik tombol **[ ⚡ UJI MODE OFFLINE ]**.
   - Sistem akan melakukan verifikasi menyeluruh:
     - Service Worker
     - Cache Storage
     - IndexedDB
     - Audio Bel
     - Ketersediaan Suara Wanita
     - Database Jadwal
   - Kotak hasil ringkas akan muncul dengan status `✓ SIAP DIGUNAKAN OFFLINE`.
3. **Pengujian Fisik**:
   - Matikan Wi-Fi atau cabut kabel LAN komputer.
   - Header aplikasi akan menampilkan badge merah `OFFLINE`.
   - Tekan tombol **▶ TES BEL + SUARA** di Pengaturan Suara. Bel dan suara pengumuman akan berbunyi normal tanpa buffering.

---

## 5. FITUR EKSPOR & IMPOR CADANGAN PAKET SUARA

Operator dapat memindahkan rekaman suara wanita ke komputer sekolah lain:
1. Di menu **Pengaturan Suara**, klik tombol **[ Ekspor Audio (JSON) ]**.
2. Berkas cadangan `bel-sekolah-paket-suara-[tanggal].json` akan terunduh.
3. Di komputer lain, buka aplikasi Bel Sekolah SD, masuk ke Pengaturan Suara, lalu klik **[ Impor Audio ]** dan pilih file JSON tersebut.
4. Seluruh rekaman suara langsung pulih seketika di IndexedDB komputer baru.

---

## 6. KETERBATASAN TEXT-TO-SPEECH (TTS) BROWSER

Alasan mengapa aplikasi Bel Sekolah SD tidak bergantung pada SpeechSynthesis untuk suara utama:
1. **Perbedaan Voice OS**: Ketersediaan suara wanita Bahasa Indonesia sangat bergantung pada sistem operasi (Windows, Android, Linux, iOS). Banyak laptop sekolah lama tidak memiliki suara Bahasa Indonesia terpasang.
2. **Ketergantungan Internet pada Beberapa Browser**: Beberapa browser seperti Google Chrome terkadang mengalirkan sintesis suara melalui server Google Cloud, sehingga saat internet mati, suara TTS tiba-tiba membisu.
3. **Intonasi Tidak Alami**: Suara TTS sering terdengar kaku atau robotik dan kurang cocok untuk pengumuman anak-anak Sekolah Dasar.
4. **Solusi Aplikasi**: Dengan rekaman audio lokal MP3 yang dicache ke Service Worker dan IndexedDB, suara selalu terdengar jernih, ramah, dan 100% konsisten di semua komputer tanpa internet.

---

## 7. CHECKLIST SEBELUM DIGUNAKAN SEBAGAI BEL SEKOLAH

- [ ] Buka aplikasi di Google Chrome atau Microsoft Edge.
- [ ] Klik tombol **[ AKTIFKAN SISTEM BEL ]** di pojok kanan atas hingga berubah menjadi **🟢 SUARA BEL SIAP**.
- [ ] Periksa menu **Status Sistem**: pastikan *Service Worker*, *Cache Storage*, dan *IndexedDB* bertanda **AKTIF**.
- [ ] Masuk ke menu **Pengaturan Suara**, pastikan Sumber Suara berada pada opsi **Audio MP3 Wanita Bahasa Indonesia Lokal**.
- [ ] Lakukan tes suara dengan menekan tombol **▶ TES BEL + SUARA**.
- [ ] Hubungkan kabel output audio komputer sekolah ke amplifier / speaker sentral sekolah, lalu sesuaikan volume speaker.
- [ ] Klik tombol **PASANG PWA** di header agar aplikasi dapat dibuka langsung dari desktop komputer seperti aplikasi native.
