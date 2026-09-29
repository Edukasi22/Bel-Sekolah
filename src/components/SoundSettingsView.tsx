import React, { useState, useEffect, useRef } from 'react';
import { SchoolSettings, CustomAudioRecord, AudioAssetCheck } from '../types';
import { soundEngine, ANNOUNCEMENT_AUDIO_MAP } from '../services/soundEngine';
import { indexedDb } from '../services/indexedDb';
import {
  Sliders,
  Volume2,
  Mic,
  Play,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  FileAudio,
  Upload,
  Download,
  Trash2,
  RotateCw,
  FolderOpen,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SoundSettingsViewProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SoundSettingsView: React.FC<SoundSettingsViewProps> = ({
  settings,
  onSaveSettings,
  isAudioUnlocked,
  onUnlockAudio,
  onShowToast,
}) => {
  const [localSettings, setLocalSettings] = useState<SchoolSettings>(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioChecks, setAudioChecks] = useState<AudioAssetCheck[]>([]);
  const [isLoadingChecks, setIsLoadingChecks] = useState<boolean>(true);
  const [isPlayingKey, setIsPlayingKey] = useState<string | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load and refresh audio asset availability
  const refreshAudioChecks = async () => {
    setIsLoadingChecks(true);
    try {
      const res = await soundEngine.checkAudioAssets();
      setAudioChecks(res.items);
    } catch (err) {
      console.warn('Gagal memeriksa aset audio:', err);
    } finally {
      setIsLoadingChecks(false);
    }
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    refreshAudioChecks();
    const updateVoices = () => {
      const voices = soundEngine.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleChange = <K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  // Test Buttons
  const handleTestBell = async () => {
    if (!isAudioUnlocked) await onUnlockAudio();
    try {
      setIsPlayingKey('bell');
      await soundEngine.playBell(localSettings);
      onShowToast('Uji Coba Bel', 'Suara bel berhasil dimainkan.', 'success');
    } catch {
      onShowToast('Audio Bel Gagal', 'Gagal memutar audio bel.', 'error');
    } finally {
      setIsPlayingKey(null);
    }
  };

  const handleTestFemaleVoice = async () => {
    if (!isAudioUnlocked) await onUnlockAudio();
    try {
      setIsPlayingKey('contoh');
      // Test sample Indonesian female voice announcement
      await soundEngine.playAnnouncement('contoh', localSettings);
      onShowToast(
        'Uji Suara Wanita',
        'Contoh pengumuman suara wanita Bahasa Indonesia berhasil dimainkan.',
        'success'
      );
    } catch {
      onShowToast('Audio Belum Tersedia', 'File contoh suara belum tersedia.', 'warning');
    } finally {
      setIsPlayingKey(null);
    }
  };

  const handleTestBellAndVoice = async () => {
    if (!isAudioUnlocked) await onUnlockAudio();
    try {
      setIsPlayingKey('both');
      await soundEngine.playBellAndAnnouncement('masuk', localSettings);
      onShowToast('Uji Bel + Suara', 'Urutan Bel dan Pengumuman Masuk Sekolah selesai.', 'success');
    } catch {
      onShowToast('Uji Gagal', 'Terjadi kendala saat memutar suara.', 'error');
    } finally {
      setIsPlayingKey(null);
    }
  };

  const handleStopAll = () => {
    soundEngine.stopAllAudio();
    setIsPlayingKey(null);
    onShowToast('Suara Berhenti', 'Seluruh suara bel dan pengumuman telah dihentikan.', 'info');
  };

  // Individual Announcement Audio Play
  const handlePlaySingle = async (key: string) => {
    if (!isAudioUnlocked) await onUnlockAudio();
    try {
      setIsPlayingKey(key);
      if (key === 'bel') {
        await soundEngine.playBell(localSettings);
      } else {
        await soundEngine.playAnnouncement(key, localSettings);
      }
      onShowToast('Audio Berhasil', `Memutar pengumuman: ${key}`, 'success');
    } catch (err) {
      onShowToast('Gagal Memutar Audio', `File audio ${key} belum tersedia.`, 'warning');
    } finally {
      setIsPlayingKey(null);
    }
  };

  // Upload Custom Audio File to IndexedDB
  const handleUploadAudio = (key: string, file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('File Terlalu Besar', 'Batas ukuran file audio adalah 8 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = event.target?.result as string;
      const record: CustomAudioRecord = {
        key,
        name: file.name,
        mimeType: file.type || 'audio/mpeg',
        base64,
        size: file.size,
        updatedAt: Date.now(),
      };

      try {
        await indexedDb.saveCustomAudio(record);
        await refreshAudioChecks();
        onShowToast(
          'Audio Kustom Tersimpan',
          `Suara "${file.name}" berhasil disimpan ke IndexedDB dan siap digunakan offline!`,
          'success'
        );
      } catch {
        onShowToast('Gagal Menyimpan', 'Tidak dapat menyimpan audio ke IndexedDB.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Custom Audio
  const handleDeleteCustomAudio = async (key: string) => {
    try {
      await indexedDb.deleteCustomAudio(key);
      await refreshAudioChecks();
      onShowToast('Audio Kustom Dihapus', 'Pengaturan kembali ke file audio bawaan.', 'info');
    } catch {
      onShowToast('Gagal Menghapus', 'Tidak dapat menghapus rekaman.', 'error');
    }
  };

  // Export all custom audio recordings as JSON
  const handleExportAudios = async () => {
    try {
      const json = await indexedDb.exportAllCustomAudios();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bel-sekolah-paket-suara-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('Ekspor Berhasil', 'Paket audio kustom berhasil diunduh.', 'success');
    } catch {
      onShowToast('Ekspor Gagal', 'Gagal membuat cadangan paket audio.', 'error');
    }
  };

  // Import custom audios from JSON
  const handleImportAudios = (file: File) => {
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const count = await indexedDb.importCustomAudios(text);
        await refreshAudioChecks();
        onShowToast('Impor Berhasil', `${count} rekaman audio berhasil dipulihkan!`, 'success');
      } catch (err) {
        onShowToast('Impor Gagal', 'Format berkas cadangan suara tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const indonesianVoices = availableVoices.filter(
    v => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia')
  );

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600" />
            <span>PENGATURAN SUARA & NADA BEL (OFFLINE READY)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem pengumuman suara wanita Bahasa Indonesia berbasis file lokal, volume, jeda waktu, dan cadangan offline
          </p>
        </div>

        {/* Global Sound Test Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTestBell}
            disabled={isPlayingKey !== null}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Volume2 className="h-4 w-4" />
            <span>▶ TES BEL</span>
          </button>

          <button
            onClick={handleTestFemaleVoice}
            disabled={isPlayingKey !== null}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Mic className="h-4 w-4" />
            <span>▶ TES SUARA WANITA</span>
          </button>

          <button
            onClick={handleTestBellAndVoice}
            disabled={isPlayingKey !== null}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>▶ TES BEL + SUARA</span>
          </button>

          <button
            onClick={handleStopAll}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <VolumeX className="h-4 w-4" />
            <span>⏹ HENTIKAN SUARA</span>
          </button>
        </div>
      </div>

      {/* Grid Settings: Sumber Suara & Parameter Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Sumber & Mode Suara */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mic className="h-4 w-4 text-blue-600" />
              <span>Sumber Suara Utama (Voice Source)</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Offline Priority
            </span>
          </div>

          <div className="space-y-3">
            {/* Opsi 1: Audio Wanita Lokal (PRIORITAS 1) */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                localSettings.voiceSource === 'local_voice'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="voiceSource"
                value="local_voice"
                checked={localSettings.voiceSource === 'local_voice'}
                onChange={() => handleChange('voiceSource', 'local_voice')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Audio MP3 Wanita Bahasa Indonesia Lokal</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ★ PRIORITAS 1 (OFFLINE PWA)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Menggunakan file audio lokal (/audio/suara-wanita/) atau rekaman kustom IndexedDB.
                  Jaminan 100% konsisten, ramah, artikulasi jelas untuk siswa SD, dan tidak bergantung pada voice browser/OS.
                </p>
              </div>
            </label>

            {/* Opsi 2: Text-to-Speech (PRIORITAS 2) */}
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                localSettings.voiceSource === 'tts'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="voiceSource"
                value="tts"
                checked={localSettings.voiceSource === 'tts'}
                onChange={() => handleChange('voiceSource', 'tts')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Text-to-Speech (TTS) Bahasa Indonesia</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Fitur Tambahan
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Menggunakan engine SpeechSynthesis bawaan browser. Dapat berbeda di setiap perangkat dan berisiko tidak bersuara saat offline jika voice Bahasa Indonesia tidak terinstal di OS.
                </p>
              </div>
            </label>
          </div>

          {/* Opsi Mode Suara Bel & Pengumuman */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Mode Eksekusi Jadwal:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleChange('voiceMode', 'bell_and_voice')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                  localSettings.voiceMode === 'bell_and_voice'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🔔 + 🗣️ Bel & Pengumuman
              </button>

              <button
                type="button"
                onClick={() => handleChange('voiceMode', 'bell_only')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                  localSettings.voiceMode === 'bell_only'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🔔 Bel Saja
              </button>

              <button
                type="button"
                onClick={() => handleChange('voiceMode', 'local_voice')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                  localSettings.voiceMode === 'local_voice'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🗣️ Pengumuman Saja
              </button>
            </div>
          </div>

          {/* Safe Fallback Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.ttsFallbackOnMissing}
                onChange={e => handleChange('ttsFallbackOnMissing', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs text-slate-700">
                <span className="font-bold">Izinkan Text-to-Speech sebagai cadangan darurat</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Jika file audio lokal atau kustom belum tersedia, sistem akan mencoba membacakan pengumuman via TTS browser. Jika tidak dicentang, hanya bel yang dibunyikan.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Card 2: Pengaturan Volume & Jeda Waktu */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-500" />
              <span>Volume & Jeda Waktu (Timing)</span>
            </h3>
          </div>

          {/* Slider 1: Volume Bel */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Volume Nada Bel</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">
                {localSettings.bellVolume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localSettings.bellVolume}
              onChange={e => handleChange('bellVolume', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Hening (0%)</span>
              <span>Sedang (50%)</span>
              <span>Maksimal (100%)</span>
            </div>
          </div>

          {/* Slider 2: Volume Pengumuman Suara */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-blue-600" />
                <span>Volume Pengumuman Suara</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">
                {localSettings.announcementVolume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localSettings.announcementVolume}
              onChange={e => handleChange('announcementVolume', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Hening (0%)</span>
              <span>Sedang (50%)</span>
              <span>Maksimal (100%)</span>
            </div>
          </div>

          {/* Slider 3: Jeda Bel -> Pengumuman */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Jeda Waktu (Bel Selesai → Pengumuman Dimulai)</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
                {localSettings.bellDelaySeconds.toFixed(1)} detik
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={localSettings.bellDelaySeconds}
              onChange={e => handleChange('bellDelaySeconds', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Memberikan jeda alami antara nada lonceng selesai berdering sebelum suara wanita mulai berbicara.
            </p>
          </div>

          {/* Pilihan Nada Bel Utama */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Model Nada Bel:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('bellChimeType', 'file')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                  localSettings.bellChimeType === 'file'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🎵 File Bel (/audio/bel.mp3)
              </button>

              <button
                type="button"
                onClick={() => handleChange('bellChimeType', 'westminster')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                  localSettings.bellChimeType === 'westminster'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🔔 Westminster Chime (Synth)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: MANAJEMEN SUARA PENGUMUMAN SEKOLAH (OFFLINE ASSETS) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileAudio className="h-5 w-5 text-indigo-600" />
              <span>DAFTAR ASET SUARA WANITA BAHASA INDONESIA (OFFLINE)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh rekaman tersimpan lokal di IndexedDB dan Cache Storage (Cache First). Tidak ada koneksi internet yang dibutuhkan saat bel berbunyi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={refreshAudioChecks}
              disabled={isLoadingChecks}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoadingChecks ? 'animate-spin text-blue-600' : ''}`} />
              <span>Periksa Aset</span>
            </button>

            <button
              onClick={handleExportAudios}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>Ekspor Audio (JSON)</span>
            </button>

            <button
              onClick={() => importFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-600" />
              <span>Impor Audio</span>
            </button>
            <input
              type="file"
              ref={importFileInputRef}
              accept=".json,application/json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImportAudios(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Tabel Aset Suara */}
        <div className="divide-y divide-slate-100">
          {audioChecks.map(item => {
            const isPlaying = isPlayingKey === item.key;
            return (
              <div
                key={item.key}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.filename}
                    </span>

                    {/* Status Badge */}
                    {item.status === 'custom_uploaded' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Kustom: {item.customName || 'Tersimpan'}</span>
                      </span>
                    ) : item.status === 'available' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        <span>✓ Tersedia (File Lokal)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>⚠️ Belum Tersedia</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">
                    "{item.expectedText}"
                  </p>
                </div>

                {/* Actions per Audio Item */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlaySingle(item.key)}
                    disabled={isPlayingKey !== null}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 min-h-[38px]"
                  >
                    <Play className={`h-3.5 w-3.5 ${isPlaying ? 'text-blue-600 animate-pulse' : ''}`} />
                    <span>{isPlaying ? 'Memutar...' : 'Putar'}</span>
                  </button>

                  {/* Upload Custom Audio File Button */}
                  <label className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition min-h-[38px]">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>{item.status === 'custom_uploaded' ? 'Ganti Suara' : 'Unggah Suara'}</span>
                    <input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/m4a,audio/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadAudio(item.key, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* Delete Custom Button */}
                  {item.status === 'custom_uploaded' && (
                    <button
                      onClick={() => handleDeleteCustomAudio(item.key)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                      title="Kembalikan ke default"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Petunjuk Memasukkan File ke Folder Public */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            <span>Lokasi Berkas Audio Offline di Komputer/Server:</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Anda dapat langsung menyalin berkas rekaman suara wanita (format <code>.mp3</code>) ke dalam folder:
            <br />
            <code className="inline-block mt-1 font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-300 text-blue-700">
              public/audio/suara-wanita/
            </code>
          </p>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Nama berkas: <code>masuk.mp3</code>, <code>pergantian-jam.mp3</code>, <code>istirahat.mp3</code>, <code>selesai-istirahat.mp3</code>, <code>pulang.mp3</code>, <code>upacara.mp3</code>, <code>kegiatan-khusus.mp3</code>.
            Jika berkas diletakkan di folder tersebut, Service Worker otomatis menyimpannya ke dalam <strong>Cache Storage (bel-sekolah-audio-v1)</strong> saat pertama kali dibuka.
          </div>
        </div>
      </div>
    </div>
  );
};
