import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { checkSWStatus, checkCacheAPI } from '../services/swRegister';
import { indexedDb } from '../services/indexedDb';
import { soundEngine } from '../services/soundEngine';
import { SchoolSettings } from '../types';
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
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface SystemStatusViewProps {
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  settings,
  isAudioUnlocked,
  onUnlockAudio,
  onShowToast,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable, install } = usePWAInstall();

  // State sub-sistem
  const [swActive, setSwActive] = useState<boolean>(false);
  const [cacheActive, setCacheActive] = useState<boolean>(false);
  const [cacheVersion, setCacheVersion] = useState<string>('bel-sekolah-v1');
  const [idbActive, setIdbActive] = useState<boolean>(false);
  const [audioSuccess, setAudioSuccess] = useState<boolean>(isAudioUnlocked);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

    // 3. IndexedDB
    const dbOk = await indexedDb.testConnection();
    setIdbActive(dbOk);

    // 4. Audio
    setAudioSuccess(isAudioUnlocked);

    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllStatus();
  }, [isAudioUnlocked]);

  const handleTestAudio = async () => {
    try {
      if (!isAudioUnlocked) {
        await onUnlockAudio();
      }
      await soundEngine.playSynthesizedBell('westminster', 80);
      setAudioSuccess(true);
      onShowToast('Audio Berhasil', 'Suara bel sintetis Westminster berhasil dibunyikan.', 'success');
    } catch (err) {
      setAudioSuccess(false);
      onShowToast('Audio Gagal', 'Gagal memutar audio browser.', 'error');
    }
  };

  const handleTestIDB = async () => {
    const ok = await indexedDb.testConnection();
    setIdbActive(ok);
    if (ok) {
      onShowToast('IndexedDB Aktif', 'Penyimpanan lokal IndexedDB siap digunakan offline.', 'success');
    } else {
      onShowToast('IndexedDB Gagal', 'Browser menolak akses IndexedDB.', 'error');
    }
  };

  const handleTestCache = async () => {
    const ok = await checkCacheAPI();
    setCacheActive(ok);
    if (ok) {
      onShowToast('Cache API Aktif', `Cache storage aktif dengan versi ${cacheVersion}.`, 'success');
    } else {
      onShowToast('Cache API Gagal', 'Cache API tidak didukung.', 'warning');
    }
  };

  // Status mapping
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
      label: 'Cache',
      value: cacheActive ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: cacheActive,
      description: `Cache API aktif (${cacheVersion}) menyimpan file inti & audio secara lokal.`,
      icon: Layers,
      color: cacheActive ? 'emerald' : 'amber',
    },
    {
      key: 'idb',
      label: 'IndexedDB',
      value: idbActive ? 'AKTIF' : 'TIDAK AKTIF',
      isOk: idbActive,
      description: idbActive
        ? 'Database IndexedDB aktif menyimpan jadwal mingguan, jadwal khusus, dan riwayat.'
        : 'IndexedDB tidak dapat diakses.',
      icon: Database,
      color: idbActive ? 'emerald' : 'rose',
    },
    {
      key: 'audio',
      label: 'Audio',
      value: audioSuccess ? 'BERHASIL' : 'GAGAL',
      isOk: audioSuccess,
      description: audioSuccess
        ? 'Web Audio API & Sound Engine siap membunyikan bel otomatis.'
        : 'Audio belum diaktivasi oleh interaksi pengguna (kebijakan autoplay).',
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
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>STATUS SISTEM (ONLINE & OFFLINE)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan langsung kesiapan komponen PWA, Service Worker, Cache API, dan IndexedDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkAllStatus}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Perbarui Status</span>
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

      {/* 7 Kotak Status Utama Sesuai Persyaratan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statusItems.map((item) => {
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
                  <button
                    onClick={handleTestAudio}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Uji Bunyi Audio →
                  </button>
                )}
                {item.key === 'idb' && (
                  <button
                    onClick={handleTestIDB}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Cek Database →
                  </button>
                )}
                {item.key === 'cache' && (
                  <button
                    onClick={handleTestCache}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Cek Cache API →
                  </button>
                )}
                {item.key === 'bell' && !isAudioUnlocked && (
                  <button
                    onClick={onUnlockAudio}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Aktifkan Sekarang →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card: Arsitektur PWA & Panduan Offline */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-blue-900/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Jaminan Berjalan Penuh Tanpa Koneksi Internet</h3>
            <p className="text-xs text-blue-200">
              Aplikasi ini 100% mandiri (Stand-alone client side). Tidak mengirim atau meminta data ke server eksternal untuk membunyikan bel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
            <div className="font-bold text-xs text-amber-300">1. Penyimpanan Data</div>
            <div className="text-xs text-blue-100 mt-1 leading-relaxed">
              Jadwal disimpan dalam <strong>IndexedDB</strong> browser. Data tidak akan terhapus saat internet terputus.
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
            <div className="font-bold text-xs text-amber-300">2. Cache API & Service Worker</div>
            <div className="text-xs text-blue-100 mt-1 leading-relaxed">
              Seluruh kode HTML, script, gaya, dan file audio bel disimpan di <strong>{cacheVersion}</strong>.
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
            <div className="font-bold text-xs text-amber-300">3. Sintesis Nada Fallback</div>
            <div className="text-xs text-blue-100 mt-1 leading-relaxed">
              Jika file audio gagal, <strong>Web Audio API Synthesizer</strong> langsung menghasilkan nada lonceng jernih secara matematis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
