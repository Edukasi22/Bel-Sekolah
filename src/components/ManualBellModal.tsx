import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { soundEngine } from '../services/soundEngine';
import { Bell, Volume2, X, Play, Square, MessageSquareText } from 'lucide-react';

interface ManualBellModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onLogManualBell: (title: string, message: string) => void;
}

export const ManualBellModal: React.FC<ManualBellModalProps> = ({
  isOpen,
  onClose,
  settings,
  isAudioUnlocked,
  onUnlockAudio,
  onShowToast,
  onLogManualBell,
}) => {
  const [mode, setMode] = useState<'both' | 'bell_only' | 'announcement_only'>('both');
  const [manualMessage, setManualMessage] = useState(
    'Perhatian. Seluruh siswa diminta berkumpul di halaman sekolah dengan tertib.'
  );
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  const presets = [
    'Perhatian. Seluruh siswa diminta berkumpul di halaman sekolah dengan tertib.',
    'Panggilan kepada seluruh ketua kelas untuk segera menuju ruang guru sekarang.',
    'Pemberitahuan. Waktu istirahat telah selesai, silakan kembali ke ruang kelas.',
    'Pengumuman. Hari ini pembelajaran dipersingkat karena akan diadakan rapat dewan guru.',
    'Perhatian. Petugas upacara dipersilakan segera mempersiapkan perlengkapan di lapangan.',
  ];

  const handlePlay = async () => {
    if (!isAudioUnlocked) {
      await onUnlockAudio();
    }

    setIsPlaying(true);
    try {
      if (mode === 'bell_only') {
        await soundEngine.playBell(settings);
        onLogManualBell('Bel Manual (Bel Saja)', 'Bel berbunyi manual tanpa pengumuman.');
      } else if (mode === 'announcement_only') {
        await soundEngine.playAnnouncement(manualMessage, settings);
        onLogManualBell('Bel Manual (Pengumuman Saja)', manualMessage);
      } else {
        // Both
        await soundEngine.executeSequence(manualMessage, settings, 'both');
        onLogManualBell('Bel Manual (Bel + Pengumuman)', manualMessage);
      }
      onShowToast('Bel Berbunyi', 'Bel manual berhasil dijalankan.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal Memutar', 'Terjadi kesalahan saat memutar bel manual.', 'error');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    soundEngine.stopSound();
    setIsPlaying(false);
    onShowToast('Suara Dihentikan', 'Pemutaran bel dan pengumuman dihentikan.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="h-5 w-5 fill-current text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">BEL MANUAL SEKOLAH</h3>
              <p className="text-xs text-slate-500">Bunyikan bel seketika untuk keperluan mendesak</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Jenis Pemutaran:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('both')}
              className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                mode === 'both'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bell className="h-5 w-5 text-blue-600 fill-current" />
              <span>Bel + Suara</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('bell_only')}
              className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                mode === 'bell_only'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bell className="h-5 w-5 text-amber-600" />
              <span>Bel Saja</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('announcement_only')}
              className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                mode === 'announcement_only'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Volume2 className="h-5 w-5 text-emerald-600" />
              <span>Pengumuman Saja</span>
            </button>
          </div>
        </div>

        {/* Message Input if needed */}
        {mode !== 'bell_only' && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Pesan Suara Bahasa Indonesia:
            </label>
            <textarea
              rows={3}
              value={manualMessage}
              onChange={e => setManualMessage(e.target.value)}
              placeholder="Ketik kalimat pengumuman di sini..."
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {/* Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
                <MessageSquareText className="h-3 w-3" /> Contoh Pesan Siap Pakai:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setManualMessage(p)}
                    className="text-[11px] text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-lg transition text-left truncate max-w-full"
                  >
                    {p.length > 40 ? p.substring(0, 40) + '...' : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Big Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            disabled={isPlaying}
            onClick={handlePlay}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-blue-700/20 active:scale-98 transition flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>PUTAR SEKARANG</span>
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-1.5 min-h-[48px]"
              title="Hentikan Suara Seketika"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>HENTIKAN</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[48px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
