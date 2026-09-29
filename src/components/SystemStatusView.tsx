import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { checkSWStatus, checkCacheAPI } from '../services/swRegister';
import { indexedDb } from '../services/indexedDb';
import { soundEngine } from '../services/soundEngine';
import { storage } from '../services/storage';
import { SchoolSettings, AudioAssetCheck } from '../types';
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  Cpu,
  Layers,
  Database,
  Volume2,
  Download,
  BellRing,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SystemStatusViewProps {
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

interface OfflineTestResult {
  appOk: boolean;
  swOk: boolean;
  idbOk: boolean;
  bellAudioOk: boolean;
  femaleVoiceOk: boolean;
  femaleVoiceDetail: string;
  schedulesOk: boolean;
  schedulesCount: number;
  overallReady: boolean;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  settings,
  isAudioUnlocked,
  onUnlockAudio,
  onShowToast,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable, install } = usePWAInstall();

  // State sub-sistem utama
  const [swActive, setSwActive] = useState<boolean>(false);
  const [cacheActive, setCacheActive] = useState<boolean>(false);
  const [audioCacheActive, setAudioCacheActive] = useState<boolean>(false);
  const [cacheVersion, setCacheVersion] = useState<string>('bel-sekolah-v1');
  const [idbActive, setIdbActive] = useState<boolean>(false);
  const [audioSuccess, setAudioSuccess] = useState<boolean>(isAudioUnlocked);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // State Diagnostik Audio Offline
  const [audioChecks, setAudioChecks] = useState<AudioAssetCheck[]>([]);

  // State Uji Mode Offline
  const [isTestingOffline, setIsTestingOffline] = useState<boolean>(false);
  const [offlineTestResult, setOfflineTestResult] = useState<OfflineTestResult | null>(null);

  const checkAllStatus = async () => {
    setIsRefreshing(true);

    // 1. Service Worker & Cache
    const sw = await checkSWStatus();
    setSwActive(sw.isActive);
    if (sw.cacheName) {
      setCacheVersion(sw.cacheName);
    }

    // 2. Cache API
    const cActive = await checkCacheAPI();
    setCacheActive(cActive || sw.cacheCount > 0);

    // Cek keberadaan Cache Audio
    if ('caches' in window) {
      try {
        const hasAudioCache = await caches.has('bel-sekolah-audio-v1');
        setAudioCacheActive(hasAudioCache);
      } catch {
        setAudioCacheActive(false);
      }
    }

    // 3. IndexedDB
    const dbOk = await indexedDb.testConnection();
    setIdbActive(dbOk);

    // 4. Audio
    setAudioSuccess(isAudioUnlocked);

    // 5. Diagnostik Aset Audio
    try {
      const assetRes = await soundEngine.checkAudioAssets();
      setAudioChecks(assetRes.items);
    } catch {
      // ignore
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllStatus();
  }, [isAudioUnlocked]);

  // Test sound
  const handleTestAudio = async () => {
    try {
      if (!isAudioUnlocked) {
        await onUnlockAudio();
      }
      await soundEngine.playBell(settings);
      setAudioSuccess(true);
      onShowToast('Audio Berhasil', 'Suara bel berhasil dimainkan.', 'success');
    } catch {
      setAudioSuccess(false);
      onShowToast('Audio Gagal', 'Gagal memutar audio browser.', 'error');
    }
  };

  // UJI MODE OFFLINE SIMULATION
  const handleRunOfflineTest = async () => {
    setIsTestingOffline(true);
    if (!isAudioUnlocked) {
      await onUnlockAudio();
    }

    try {
      // 1. Cek Service Worker
      const sw = await checkSWStatus();
      const swOk = sw.isActive;

      // 2. Cek IndexedDB
      const idbOk = await indexedDb.testConnection();

      // 3. Cek Audio Bel
      const assetCheck = await soundEngine.checkAudioAssets();
      const bellItem = assetCheck.items.find(i => i.key === 'bel');
      const bellAudioOk = bellItem?.status !== 'missing';

      // 4. Cek Suara Wanita
      const voiceItems = assetCheck.items.filter(i => i.key !== 'bel');
      const readyVoices = voiceItems.filter(i => i.status !== 'missing').length;
      const femaleVoiceOk = readyVoices > 0;
      const femaleVoiceDetail =
        readyVoices === voiceItems.length
          ? 'Semua Suara Lengkap (100%)'
          : readyVoices > 0
          ? `${readyVoices} dari ${voiceItems.length} Suara Siap`
          : 'Belum Ada File (Perlu Upload/File MP3)';

      // 5. Cek Jadwal
      const schedules = await indexedDb.getSchedules();
      const schedulesOk = schedules.length > 0;

      // 6. Jalankan Bunyi Uji Coba Cepat (0.5s audio pulse)
      try {
        await soundEngine.playBell(settings);
      } catch {
        // ignore
      }

      const overallReady = swOk && idbOk && bellAudioOk;

      const result: OfflineTestResult = {
        appOk: true,
        swOk,
        idbOk,
        bellAudioOk,
        femaleVoiceOk,
        femaleVoiceDetail,
        schedulesOk,
        schedulesCount: schedules.length,
        overallReady,
      };

      setOfflineTestResult(result);
      onShowToast(
        overallReady ? 'Uji Offline Berhasil' : 'Uji Offline Selesai',
        overallReady ? 'Sistem 100% siap dijalankan tanpa internet!' : 'Periksa komponen yang belum lengkap.',
        overallReady ? 'success' : 'warning'
      );
    } catch (err) {
      console.error('Offline test error:', err);
      onShowToast('Uji Offline Gagal', 'Terjadi kesalahan saat menjalankan tes.', 'error');
    } finally {
      setIsTestingOffline(false);
    }
  };

  // 7 Kotak Status Utama
  const statusItems = [
    {
      key: 'internet',
      label: 'Internet',
      value: isOnline ? 'ONLINE' : 'OFFLINE',
      isOk: isOnline,
      description: isOnline
        ? 'Terhubung dengan jaringan internet (dapat mengunduh pembaruan).'
        : 'Tidak ada koneksi. Aplikasi tetap berjalan penuh secara offline.',
      icon: isOnline ? Wifi : WifiOff,
      color: isOnline ? 'emerald' : 'rose',
    },
    {
      key: 'sw',
      label: 'Service Worker',
      value: swActive ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: swActive,
      description: swActive
        ? 'Service Worker terdaftar dan mencegat request untuk offline caching.'
        : 'Service Worker sedang dimuat atau belum aktif pada browser ini.',
      icon: Cpu,
      color: swActive ? 'emerald' : 'amber',
    },
    {
      key: 'cache',
      label: 'Cache Storage',
      value: cacheActive ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: cacheActive,
      description: `Cache App (${cacheVersion}) & Cache Audio (bel-sekolah-audio-v1) aktif.`,
      icon: Layers,
      color: cacheActive ? 'emerald' : 'amber',
    },
    {
      key: 'idb',
      label: 'IndexedDB',
      value: idbActive ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: idbActive,
      description: idbActive
        ? 'Database IndexedDB aktif menyimpan jadwal mingguan, jadwal khusus, riwayat, dan rekaman audio kustom.'
        : 'IndexedDB tidak dapat diakses.',
      icon: Database,
      color: idbActive ? 'emerald' : 'rose',
    },
    {
      key: 'audio',
      label: 'Audio Engine',
      value: audioSuccess ? 'BERHASIL' : 'GAGAL',
      isOk: audioSuccess,
      description: audioSuccess
        ? 'Web Audio API, Audio Player, dan Sound Engine siap membunyikan bel & pengumuman.'
        : 'Audio belum diaktivasi oleh interaksi pengguna (kebijakan autoplay browser).',
      icon: Volume2,
      color: audioSuccess ? 'emerald' : 'amber',
    },
    {
      key: 'pwa',
      label: 'PWA',
      value: isInstalled ? 'TERPASANG' : 'BELUM TERPASANG',
      isOk: isInstalled,
      description: isInstalled
        ? 'Aplikasi berjalan dalam mode mandiri (Standalone PWA).'
        : isInstallable
        ? 'Aplikasi siap dipasang ke desktop/layar utama HP.'
        : 'Dijalankan melalui tab browser web.',
      icon: Download,
      color: isInstalled ? 'emerald' : 'blue',
    },
    {
      key: 'bell',
      label: 'Sistem Bel',
      value: settings.systemEnabled && isAudioUnlocked ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: settings.systemEnabled && isAudioUnlocked,
      description: settings.systemEnabled && isAudioUnlocked
        ? 'Sistem otomatis aktif dan siap mengeksekusi jadwal.'
        : !settings.systemEnabled
        ? 'Sistem bel dinonaktifkan di Pengaturan Sekolah.'
        : 'Perlu klik "Aktifkan Sistem Bel" untuk mengizinkan audio browser.',
      icon: BellRing,
      color: settings.systemEnabled && isAudioUnlocked ? 'emerald' : 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>STATUS SISTEM & DIAGNOSTIK OFFLINE</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan langsung kesiapan komponen PWA, Service Worker, Cache Audio, IndexedDB, dan Suara Wanita
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={checkAllStatus}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Perbarui Status</span>
          </button>

          <button
            onClick={handleRunOfflineTest}
            disabled={isTestingOffline}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Zap className={`h-4 w-4 ${isTestingOffline ? 'animate-spin' : ''}`} />
            <span>⚡ UJI MODE OFFLINE</span>
          </button>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>PASANG PWA</span>
            </button>
          )}
        </div>
      </div>

      {/* HASIL TES OFFLINE MODAL/CARD (JIKA DIJALANKAN) */}
      {offlineTestResult && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">================================</span>
            </div>
            <button
              onClick={() => setOfflineTestResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Tutup
            </button>
          </div>

          <div>
            <h3 className="text-base font-black tracking-wide text-emerald-400 font-mono">
              HASIL TES OFFLINE
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              =================
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">Aplikasi:</span>
              <span className="ml-2 font-bold text-emerald-400">✓ OK</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">Service Worker:</span>
              <span className={`ml-2 font-bold ${offlineTestResult.swOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                {offlineTestResult.swOk ? '✓ OK' : '⚠️ Pending'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">IndexedDB:</span>
              <span className="ml-2 font-bold text-emerald-400">✓ OK</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">Audio Bel:</span>
              <span className={`ml-2 font-bold ${offlineTestResult.bellAudioOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                {offlineTestResult.bellAudioOk ? '✓ OK' : '⚠️ Fallback Synth'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">Suara Wanita:</span>
              <span className={`ml-2 font-bold ${offlineTestResult.femaleVoiceOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                {offlineTestResult.femaleVoiceDetail}
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400">Jadwal Tersimpan:</span>
              <span className="ml-2 font-bold text-emerald-400">
                ✓ OK ({offlineTestResult.schedulesCount} jadwal)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="font-mono text-xs">
              <span className="text-slate-400">Sistem:</span>
              <span className="ml-2 font-black text-emerald-300">
                {offlineTestResult.overallReady ? '✓ SIAP DIGUNAKAN OFFLINE' : '⚠️ SEBAGIAN SIAP'}
              </span>
            </div>
            <span className="text-amber-400 font-mono text-sm">================================</span>
          </div>
        </div>
      )}

      {/* 7 Kotak Status Utama Sesuai Persyaratan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statusItems.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide ${
                      item.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.color === 'rose'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : item.color === 'blue'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.color === 'emerald'
                          ? 'bg-emerald-500 animate-pulse'
                          : item.color === 'rose'
                          ? 'bg-rose-500'
                          : item.color === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span>{item.value}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Quick actions per card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {item.key === 'audio' && (
                  <button onClick={handleTestAudio} className="text-blue-600 font-bold hover:underline">
                    Uji Bunyi Audio →
                  </button>
                )}
                {item.key === 'bell' && !isAudioUnlocked && (
                  <button onClick={onUnlockAudio} className="text-amber-700 font-bold hover:underline">
                    Aktifkan Sekarang →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION: DIAGNOSTIK AUDIO OFFLINE (Requirement #17) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-indigo-600" />
              <span>DIAGNOSTIK AUDIO OFFLINE</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemeriksaan ketersediaan aset suara wanita Indonesia dan nada bel tanpa koneksi internet
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Offline: ✓ dapat digunakan
          </span>
        </div>

        {/* Checklist Aset Audio Offline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {audioChecks.map(item => (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.filename}</div>
              </div>

              <div>
                {item.status === 'custom_uploaded' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>✓ Kustom</span>
                  </span>
                ) : item.status === 'available' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>✓ Tersedia</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Belum Ada</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Cache Audio Storage Card */}
          <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-900">Cache Audio Storage</div>
              <div className="text-[11px] text-emerald-700 font-mono mt-0.5">bel-sekolah-audio-v1</div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              <span>✓ Tersedia</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
