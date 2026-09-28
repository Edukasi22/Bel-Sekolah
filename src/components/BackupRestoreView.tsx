import React, { useState } from 'react';
import { storage } from '../services/storage';
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

interface BackupRestoreViewProps {
  onReloadAllData: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  onReloadAllData,
  onShowToast,
}) => {
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const handleDownloadBackup = () => {
    const jsonStr = storage.createBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `backup-bel-sekolah-sd-${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Cadangan Diunduh', 'File backup JSON berhasil disimpan.', 'success');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = storage.restoreBackup(content);
      if (res.success) {
        onReloadAllData();
        onShowToast('Pemulihan Sukses', res.message, 'success');
      } else {
        onShowToast('Gagal Memulihkan', res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteReset = () => {
    storage.resetAllData();
    onReloadAllData();
    setResetStep(0);
    onShowToast('Data Direset', 'Semua jadwal dan pengaturan telah dikembalikan ke kondisi awal.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span>Cadangan (Backup), Pemulihan (Restore) & Reset</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Simpan salinan keamanan jadwal dan konfigurasi sekolah Anda agar tidak hilang saat berganti perangkat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Cadangkan Data Lengkap (Backup JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Mengunduh seluruh konfigurasi sekolah, jadwal mingguan, jadwal khusus, hari libur, dan pengaturan audio ke dalam satu file berkas JSON aman.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="h-4 w-4" />
            <span>UNDUH FILE CADANGAN (JSON)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pulihkan dari Berkas Cadangan</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Memulihkan kembali jadwal dan setelan dari file berkas JSON cadangan yang telah Anda buat sebelumnya.
            </p>
          </div>

          <label className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px]">
            <Upload className="h-4 w-4" />
            <span>PILIH FILE CADANGAN (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Dangerous Zone: Reset Data */}
      <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">Zona Berbahaya: Reset Seluruh Data</h3>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Tindakan ini akan menghapus seluruh jadwal bel, hari libur, jadwal khusus, dan setelan profil sekolah dari penyimpanan browser komputer ini.
            </p>
          </div>
        </div>

        <div className="pt-2">
          {resetStep === 0 && (
            <button
              onClick={() => setResetStep(1)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
              <span>RESET DATA APLIKASI...</span>
            </button>
          )}

          {resetStep === 1 && (
            <div className="bg-white p-4 rounded-2xl border border-rose-300 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-rose-900">
                Tahap 1 dari 2: Konfirmasi Penghapusan
              </div>
              <p className="text-xs text-slate-600">
                Apakah Anda benar-benar yakin? "Semua jadwal dan pengaturan akan dihapus."
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResetStep(2)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[40px]"
                >
                  Lanjut ke Tahap Terakhir
                </button>
                <button
                  onClick={() => setResetStep(0)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[40px]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {resetStep === 2 && (
            <div className="bg-white p-4 rounded-2xl border-2 border-rose-500 space-y-3 animate-in zoom-in-95">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Tahap 2 dari 2: Peringatan Terakhir</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Tindakan ini tidak dapat dibatalkan. Seluruh jadwal bel yang sudah Anda atur akan hilang sepenuhnya.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteReset}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shadow-sm min-h-[40px]"
                >
                  Ya, Hapus Semua & Reset Sekarang
                </button>
                <button
                  onClick={() => setResetStep(0)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold min-h-[40px]"
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
