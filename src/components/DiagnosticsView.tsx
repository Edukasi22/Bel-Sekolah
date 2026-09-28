import React, { useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { soundEngine } from '../services/soundEngine';
import { scheduler, ClockState } from '../services/scheduler';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Volume2,
  Mic,
  Sparkles,
  Zap,
  RotateCcw,
  Clock,
  Radio,
} from 'lucide-react';

interface DiagnosticsViewProps {
  clock: ClockState;
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  isTestMode: boolean;
  onToggleTestMode: (enabled: boolean) => void;
  onTriggerNextNow: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  clock,
  settings,
  isAudioUnlocked,
  onUnlockAudio,
  isTestMode,
  onToggleTestMode,
  onTriggerNextNow,
  onShowToast,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable } = usePWAInstall();

  const [hasSpeech, setHasSpeech] = useState(false);
  const [indonesianVoices, setIndonesianVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasLocalStorage, setHasLocalStorage] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [simTime, setSimTime] = useState('07:00');

  useEffect(() => {
    // Check speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSpeech(true);
      const idVoices = soundEngine.getIndonesianVoices();
      setIndonesianVoices(idVoices);
    }

    // Check storage
    try {
      localStorage.setItem('__test_storage__', '1');
      localStorage.removeItem('__test_storage__');
      setHasLocalStorage(true);
    } catch {
      setHasLocalStorage(false);
    }

    // Check SW
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      setHasServiceWorker(true);
    }
  }, []);

  const handleApplySimTime = () => {
    scheduler.setSimulatedTime(simTime, settings);
    onShowToast('Waktu Simulasi Diatur', `Jam sistem disimulasikan ke ${simTime}.`, 'info');
  };

  const handleResetSimTime = () => {
    scheduler.resetSimulatedTime();
    onShowToast('Simulasi Direset', 'Jam sistem kembali ke waktu komputer asli.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Diagnostik Sistem & Mode Pengujian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan otomatis kesiapan audio, speech, penyimpanan offline, dan simulasi jadwal
          </p>
        </div>

        <button
          onClick={onUnlockAudio}
          className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
        >
          <Volume2 className="h-4 w-4" />
          <span>Uji Audio Context</span>
        </button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Item 1: Jam Sistem */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Jam Sistem</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-black font-mono text-slate-900">{clock.timeStr}</div>
          <div className="text-xs text-slate-500 mt-1">{clock.dateFormatted}</div>
        </div>

        {/* Item 2: Audio Context */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Web Audio API</span>
            {isAudioUnlocked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            {isAudioUnlocked ? '✓ OK (Siap Putar)' : 'Perlu Aktivasi'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isAudioUnlocked ? 'Autoplay browser telah diizinkan' : 'Klik Aktifkan Sistem Bel'}
          </div>
        </div>

        {/* Item 3: SpeechSynthesis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">SpeechSynthesis API</span>
            {hasSpeech ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-500" />
            )}
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            {hasSpeech ? '✓ OK (Didukung)' : 'Tidak Didukung'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Membacakan teks pengumuman suara
          </div>
        </div>

        {/* Item 4: Voice Bahasa Indonesia */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Voice Indonesia</span>
            {indonesianVoices.length > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            {indonesianVoices.length > 0 ? `✓ Tersedia (${indonesianVoices.length})` : 'Gunakan Fallback'}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {indonesianVoices.length > 0 ? indonesianVoices[0].name : 'Suara bawaan browser'}
          </div>
        </div>

        {/* Item 5: Penyimpanan Offline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Penyimpanan Lokal</span>
            {hasLocalStorage ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-500" />
            )}
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            {hasLocalStorage ? '✓ OK (Tersimpan)' : 'Gagal Menyimpan'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Data jadwal tetap aman tanpa internet</div>
        </div>

        {/* Item 6: Service Worker & PWA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">PWA & Offline Cache</span>
            {hasServiceWorker ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">
            {isInstalled ? '✓ Terpasang (Standalone)' : hasServiceWorker ? '✓ Service Worker Aktif' : 'Terbatas'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Status Jaringan: {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </div>

      {/* Mode Test (Simulasi Jadwal) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Mode Test & Simulasi Jadwal</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan mode ini sebelum bel dipakai di sekolah untuk memastikan audio dan jadwal bekerja 100%
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isTestMode}
              onChange={e => onToggleTestMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {isTestMode ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Zap className="h-4 w-4" />
              <span>Mode Test Sedang Aktif</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trigger Next Now */}
              <div className="bg-white p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-slate-800 block">
                  Uji Jadwal Terdekat Sekarang
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Langsung memicu suara bel dan pengumuman untuk jadwal berikutnya tanpa menunggu waktu tiba.
                </span>
                <button
                  type="button"
                  onClick={onTriggerNextNow}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 min-h-[40px]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Jalankan Jadwal Berikutnya</span>
                </button>
              </div>

              {/* Time Travel Picker */}
              <div className="bg-white p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-slate-800 block">
                  Simulasi Jam Tertentu
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Ubah jam internal aplikasi ke jam tertentu untuk melihat reaksi countdown dan jadwal.
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="time"
                    value={simTime}
                    onChange={e => setSimTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={handleApplySimTime}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 min-h-[40px]"
                  >
                    Terapkan
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSimTime}
                    className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Kembali ke jam asli"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-2xl">
            Mode test dinonaktifkan. Nyalakan switch di atas jika Anda ingin melakukan simulasi waktu dan pengujian instan.
          </div>
        )}
      </div>
    </div>
  );
};
